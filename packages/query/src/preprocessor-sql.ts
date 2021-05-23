import { assert, SQLQueryAST, TransformType } from './loader/sql';
import {
  IInterpolatedQuery,
  INestedParameters,
  IQueryParameters,
  IScalarArrayParam,
  IScalarParam,
  ParamPgTypes,
  ParamTransform,
  prepareValue,
  QueryParam,
  replaceIntervals,
  Scalar,
} from './preprocessor';

/* Processes query AST formed by new parser from pure SQL files */
export const processSQLQueryAST = (
  query: SQLQueryAST,
  passedParams?: IQueryParameters,
  paramPgTypes?: ParamPgTypes,
): IInterpolatedQuery => {
  const bindings: Scalar[] = [];
  const paramMapping: QueryParam[] = [];
  const usedParams = query.params.filter((p) => p.name in query.usedParamSet);
  const { a: statementStart } = query.statement.loc;
  let i = 1;
  const intervals: { a: number; b: number; sub: string }[] = [];
  for (const usedParam of usedParams) {
    const paramLocs = usedParam.codeRefs.used.map(({ a, b }) => ({
      a: a - statementStart - 1,
      b: b - statementStart,
    }));

    // Handle spread transform
    if (usedParam.transform.type === TransformType.ArraySpread) {
      let sub: string;
      if (passedParams) {
        const paramValue = passedParams[usedParam.name];
        const paramPgType = paramPgTypes?.[usedParam.name];
        assert(typeof paramPgType != 'object');
        // TODO: this cast it wrong, it could be a json[], but json isn't
        // limited to being a Scalar.
        sub = (paramValue as Scalar[])
          .map((val) => {
            const preparedValue =
              paramPgType != null ? prepareValue(val, paramPgType) : val;
            bindings.push(preparedValue);
            return `$${i++}`;
          })
          .join(',');
      } else {
        const idx = i++;
        paramMapping.push({
          name: usedParam.name,
          type: ParamTransform.Spread,
          assignedIndex: idx,
        } as IScalarArrayParam);
        sub = `$${idx}`;
      }
      paramLocs.forEach((pl) =>
        intervals.push({
          ...pl,
          sub: `(${sub})`,
        }),
      );
      continue;
    }

    // Handle pick transform
    if (usedParam.transform.type === TransformType.PickTuple) {
      const dict: {
        [key: string]: IScalarParam;
      } = {};
      const sub = usedParam.transform.keys
        .map((pickKey) => {
          const idx = i++;
          dict[pickKey] = {
            name: pickKey,
            type: ParamTransform.Scalar,
            assignedIndex: idx,
          } as IScalarParam;
          if (passedParams) {
            const paramValue = passedParams[
              usedParam.name
            ] as INestedParameters;
            const paramPgType = paramPgTypes?.[usedParam.name];
            assert(typeof paramPgType != 'string');
            const pickKeyParamPgType = paramPgType?.[pickKey];
            const val = paramValue[pickKey];
            bindings.push(
              pickKeyParamPgType != null
                ? prepareValue(val, pickKeyParamPgType)
                : val,
            );
          }
          return `$${idx}`;
        })
        .join(',');
      if (!passedParams) {
        paramMapping.push({
          name: usedParam.name,
          type: ParamTransform.Pick,
          dict,
        });
      }

      paramLocs.forEach((pl) =>
        intervals.push({
          ...pl,
          sub: `(${sub})`,
        }),
      );
      continue;
    }

    // Handle spreadPick transform
    if (usedParam.transform.type === TransformType.PickArraySpread) {
      let sub: string;
      if (passedParams) {
        const passedParam = passedParams[usedParam.name] as INestedParameters[];
        const paramPgType = paramPgTypes?.[usedParam.name];
        assert(typeof paramPgType != 'string');
        sub = passedParam
          .map((entity) => {
            assert(usedParam.transform.type === TransformType.PickArraySpread);
            const ssub = usedParam.transform.keys
              .map((pickKey) => {
                const val = entity[pickKey];
                const pickKeyParamPgType = paramPgType?.[pickKey];
                bindings.push(
                  pickKeyParamPgType != null
                    ? prepareValue(val, pickKeyParamPgType)
                    : val,
                );
                return `$${i++}`;
              })
              .join(',');
            return ssub;
          })
          .join('),(');
      } else {
        const dict: {
          [key: string]: IScalarParam;
        } = {};
        sub = usedParam.transform.keys
          .map((pickKey) => {
            const idx = i++;
            dict[pickKey] = {
              name: pickKey,
              type: ParamTransform.Scalar,
              assignedIndex: idx,
            } as IScalarParam;
            return `$${idx}`;
          })
          .join(',');
        paramMapping.push({
          name: usedParam.name,
          type: ParamTransform.PickSpread,
          dict,
        });
      }

      paramLocs.forEach((pl) =>
        intervals.push({
          ...pl,
          sub: `(${sub})`,
        }),
      );
      continue;
    }

    // Handle scalar transform
    const assignedIndex = i++;
    if (passedParams) {
      const paramValue = passedParams[usedParam.name] as Scalar;
      const paramPgType = paramPgTypes?.[usedParam.name];
      assert(typeof paramPgType != 'object');
      bindings.push(
        paramPgType != null
          ? prepareValue(paramValue, paramPgType)
          : paramValue,
      );
    } else {
      paramMapping.push({
        name: usedParam.name,
        type: ParamTransform.Scalar,
        assignedIndex,
      } as IScalarParam);
    }

    paramLocs.forEach((pl) =>
      intervals.push({
        ...pl,
        sub: `$${assignedIndex}`,
      }),
    );
  }
  const flatStr = replaceIntervals(query.statement.body, intervals);
  return {
    mapping: paramMapping,
    query: flatStr,
    bindings,
  };
};
