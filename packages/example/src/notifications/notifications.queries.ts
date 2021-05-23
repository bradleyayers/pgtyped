/** Types generated for queries found in "src/notifications/notifications.sql" */
import { PreparedQuery } from '@pgtyped/query';

export type notification_type = 'deadline' | 'notification' | 'reminder';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'SendNotifications' parameters type */
export interface ISendNotificationsParams {
  notifications: readonly ({
    user_id: number | null | void,
    payload: Json | null | void,
    type: notification_type | null | void
  })[];
}

/** 'SendNotifications' return type */
export interface ISendNotificationsResult {
  notification_id: number;
}

/** 'SendNotifications' query type */
export interface ISendNotificationsQuery {
  params: ISendNotificationsParams;
  result: ISendNotificationsResult;
}

const sendNotificationsIR: any = {"ast":{"name":"SendNotifications","params":[{"name":"notifications","codeRefs":{"defined":{"a":38,"b":50,"line":3,"col":9},"used":[{"a":147,"b":159,"line":6,"col":8}]},"transform":{"type":"pick_array_spread","keys":["user_id","payload","type"]}}],"usedParamSet":{"notifications":true},"statement":{"body":"INSERT INTO notifications (user_id, payload, type)\nVALUES :notifications RETURNING id as notification_id","loc":{"a":88,"b":191,"line":5,"col":0}}},"paramPgTypes":{"notifications":{"user_id":"int4","payload":"jsonb","type":"notification_type"}}};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO notifications (user_id, payload, type)
 * VALUES :notifications RETURNING id as notification_id
 * ```
 */
export const sendNotifications = new PreparedQuery<ISendNotificationsParams,ISendNotificationsResult>(sendNotificationsIR);


/** 'GetNotifications' parameters type */
export interface IGetNotificationsParams {
  userId: number | null | void;
}

/** 'GetNotifications' return type */
export interface IGetNotificationsResult {
  id: number;
  user_id: number | null;
  payload: Json;
  type: notification_type;
}

/** 'GetNotifications' query type */
export interface IGetNotificationsQuery {
  params: IGetNotificationsParams;
  result: IGetNotificationsResult;
}

const getNotificationsIR: any = {"ast":{"name":"GetNotifications","params":[{"name":"userId","transform":{"type":"scalar"},"codeRefs":{"used":[{"a":272,"b":277,"line":11,"col":18}]}}],"usedParamSet":{"userId":true},"statement":{"body":"SELECT *\n  FROM notifications\n WHERE user_id = :userId","loc":{"a":224,"b":277,"line":9,"col":0}}},"paramPgTypes":{"userId":"int4"}};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 *   FROM notifications
 *  WHERE user_id = :userId
 * ```
 */
export const getNotifications = new PreparedQuery<IGetNotificationsParams,IGetNotificationsResult>(getNotificationsIR);


/** 'ThresholdFrogs' parameters type */
export interface IThresholdFrogsParams {
  numFrogs: number | null | void;
}

/** 'ThresholdFrogs' return type */
export interface IThresholdFrogsResult {
  user_name: string;
  payload: Json;
  type: notification_type;
}

/** 'ThresholdFrogs' query type */
export interface IThresholdFrogsQuery {
  params: IThresholdFrogsParams;
  result: IThresholdFrogsResult;
}

const thresholdFrogsIR: any = {"ast":{"name":"ThresholdFrogs","params":[{"name":"numFrogs","transform":{"type":"scalar"},"codeRefs":{"used":[{"a":455,"b":462,"line":20,"col":46}]}}],"usedParamSet":{"numFrogs":true},"statement":{"body":"SELECT u.user_name, n.payload, n.type\nFROM notifications n\nINNER JOIN users u on n.user_id = u.id\nWHERE CAST (n.payload->'num_frogs' AS int) > :numFrogs","loc":{"a":311,"b":462,"line":17,"col":0}}},"paramPgTypes":{"numFrogs":"int4"}};

/**
 * Query generated from SQL:
 * ```
 * SELECT u.user_name, n.payload, n.type
 * FROM notifications n
 * INNER JOIN users u on n.user_id = u.id
 * WHERE CAST (n.payload->'num_frogs' AS int) > :numFrogs
 * ```
 */
export const thresholdFrogs = new PreparedQuery<IThresholdFrogsParams,IThresholdFrogsResult>(thresholdFrogsIR);


/** 'FindMatchingPayload' parameters type */
export interface IFindMatchingPayloadParams {
  payloads: readonly (Json | null | void)[];
}

/** 'FindMatchingPayload' return type */
export interface IFindMatchingPayloadResult {
  id: number;
  user_id: number | null;
  payload: Json;
  type: notification_type;
}

/** 'FindMatchingPayload' query type */
export interface IFindMatchingPayloadQuery {
  params: IFindMatchingPayloadParams;
  result: IFindMatchingPayloadResult;
}

const findMatchingPayloadIR: any = {"ast":{"name":"FindMatchingPayload","params":[{"name":"payloads","codeRefs":{"defined":{"a":506,"b":513,"line":24,"col":9},"used":[{"a":576,"b":583,"line":28,"col":19}]},"transform":{"type":"array_spread"}}],"usedParamSet":{"payloads":true},"statement":{"body":"SELECT *\n  FROM notifications\n WHERE payload IN :payloads","loc":{"a":527,"b":583,"line":26,"col":0}}},"paramPgTypes":{"payloads":"jsonb"}};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 *   FROM notifications
 *  WHERE payload IN :payloads
 * ```
 */
export const findMatchingPayload = new PreparedQuery<IFindMatchingPayloadParams,IFindMatchingPayloadResult>(findMatchingPayloadIR);


