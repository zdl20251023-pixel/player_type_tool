/**
 * @file 策略档位清单
 * @description 按盲注结构和人数范围维护翻前/翻后可用的策略档位名称与指标，用于类型提示与运行时校验
 * @note 此文件由 gen_catalog.js 脚本从 017-player-profile-data-cash-5.json 生成，请勿手动修改数据部分
 */

/**
 * 支持的盲注结构格式（X-Y：盲注数-前注占比）
 */
export const GAME_FORMATS = ['2-0', '2-50', '2-100', '3-0', '3-50'] as const

/**
 * 盲注结构类型
 */
export type GameFormat = (typeof GAME_FORMATS)[number]

/**
 * 支持的座位人数范围
 * - 2-3p：2~3人桌（短牌/少人）
 * - 4-6p：4~6人桌（中人数）
 * - 7-9p：7~9人桌（满环桌，默认兜底）
 */
export const SEAT_RANGES = ['2-3p', '4-6p', '7-9p'] as const
export type SeatRange = (typeof SEAT_RANGES)[number]

/**
 * 策略档位元数据（翻前翻后统一）
 * 字段来自 017-player-profile-data-cash-5.json 实测数据
 */
export interface ProfileMeta {
  name: string
  /** 入池率（0-1） */
  vpip: number
  /** 加注入池率（0-1） */
  pfr: number
  /** 攻击性系数 */
  af: number
  /** 摊牌赢率（0-1） */
  wtsd: number
}

/** @deprecated 请使用 ProfileMeta */
export type PreflopProfileMeta = ProfileMeta
/** @deprecated 请使用 ProfileMeta */
export type PostflopProfileMeta = ProfileMeta

/**
 * 翻前档位元数据清单（三维：盲注结构 → 人数范围 → 档位数组）
 * 数据来源：017-player-profile-data-cash-5.json
 */
export const PREFLOP_PROFILE_META_BY_FORMAT: {
  [F in GameFormat]?: { [R in SeatRange]?: ProfileMeta[] }
} = {
  '2-0': {
    '2-3p': [
      { name: 'gto', vpip: 0.6561, pfr: 0.3977, af: 1.8429, wtsd: 0.4686 },
      { name: 'vpip80-pfr16', vpip: 0.9534, pfr: 0.2498, af: 1.7951, wtsd: 0.4257 },
      { name: 'vpip20-pfr10', vpip: 0.2028, pfr: 0.1128, af: 1.7172, wtsd: 0.5508 },
      { name: 'vpip69-pfr53', vpip: 0.9259, pfr: 0.8033, af: 2.0806, wtsd: 0.4497 },
      { name: 'vpip47-pfr28', vpip: 0.7327, pfr: 0.5401, af: 1.9477, wtsd: 0.4551 },
      { name: 'vpip60-pfr12', vpip: 0.8176, pfr: 0.2037, af: 1.7805, wtsd: 0.4494 },
      { name: 'vpip79-pfr36', vpip: 0.948, pfr: 0.5231, af: 1.8705, wtsd: 0.4372 },
      { name: 'vpip41-pfr10', vpip: 0.5918, pfr: 0.1616, af: 1.7185, wtsd: 0.4805 },
      { name: 'vpip60-pfr39', vpip: 0.8803, pfr: 0.6818, af: 1.9751, wtsd: 0.445 },
      { name: 'vpip33-pfr23', vpip: 0.5017, pfr: 0.4117, af: 1.9729, wtsd: 0.4886 },
      { name: 'vpip64-pfr25', vpip: 0.8737, pfr: 0.4541, af: 1.8683, wtsd: 0.4394 },
      { name: 'vpip31-pfr11', vpip: 0.4129, pfr: 0.1714, af: 1.7174, wtsd: 0.4996 },
      { name: 'vpip50-pfr19', vpip: 0.7229, pfr: 0.3537, af: 1.8178, wtsd: 0.458 },
      { name: 'vpip70-pfr39', vpip: 0.9291, pfr: 0.631, af: 1.9215, wtsd: 0.4415 },
      { name: 'vpip68-pfr7', vpip: 0.8899, pfr: 0.0863, af: 1.7146, wtsd: 0.4456 },
      { name: 'vpip25-pfr18', vpip: 0.3509, pfr: 0.2956, af: 1.9459, wtsd: 0.5076 },
      { name: 'vpip72-pfr30', vpip: 0.9312, pfr: 0.506, af: 1.8771, wtsd: 0.4365 },
      { name: 'vpip52-pfr37', vpip: 0.8107, pfr: 0.687, af: 2.0626, wtsd: 0.4513 },
      { name: 'vpip41-pfr20', vpip: 0.6217, pfr: 0.3765, af: 1.8402, wtsd: 0.4678 },
      { name: 'vpip70-pfr20', vpip: 0.9097, pfr: 0.3497, af: 1.8078, wtsd: 0.4366 },
      { name: 'vpip35-pfr30', vpip: 0.5919, pfr: 0.5711, af: 2.1669, wtsd: 0.4665 },
      { name: 'vpip78-pfr23', vpip: 0.9491, pfr: 0.3785, af: 1.8158, wtsd: 0.4327 },
      { name: 'vpip58-pfr29', vpip: 0.8382, pfr: 0.5451, af: 1.9221, wtsd: 0.4479 },
      { name: 'vpip61-pfr46', vpip: 0.903, pfr: 0.7809, af: 2.0711, wtsd: 0.4474 },
      { name: 'vpip48-pfr11', vpip: 0.6889, pfr: 0.1794, af: 1.7611, wtsd: 0.4656 },
      { name: 'vpip37-pfr15', vpip: 0.534, pfr: 0.2681, af: 1.7681, wtsd: 0.4839 },
      { name: 'vpip63-pfr17', vpip: 0.8569, pfr: 0.3187, af: 1.801, wtsd: 0.4414 },
      { name: 'vpip69-pfr13', vpip: 0.8974, pfr: 0.2231, af: 1.7697, wtsd: 0.4378 },
      { name: 'vpip58-pfr22', vpip: 0.8193, pfr: 0.4116, af: 1.8473, wtsd: 0.4429 },
      { name: 'vpip64-pfr34', vpip: 0.8931, pfr: 0.5927, af: 1.9101, wtsd: 0.4415 },
      { name: 'vpip75-pfr43', vpip: 0.9374, pfr: 0.6413, af: 1.9358, wtsd: 0.4424 },
      { name: 'vpip54-pfr15', vpip: 0.7676, pfr: 0.2774, af: 1.8005, wtsd: 0.4526 },
      { name: 'vpip42-pfr29', vpip: 0.6639, pfr: 0.546, af: 2.0322, wtsd: 0.4597 },
      { name: 'vpip69-pfr47', vpip: 0.9296, pfr: 0.7324, af: 1.9939, wtsd: 0.4476 },
      { name: 'vpip53-pfr26', vpip: 0.7904, pfr: 0.499, af: 1.8943, wtsd: 0.4498 },
      { name: 'vpip31-pfr16', vpip: 0.4467, pfr: 0.2798, af: 1.8164, wtsd: 0.4875 },
      { name: 'vpip25-pfr8', vpip: 0.2845, pfr: 0.0924, af: 1.6306, wtsd: 0.5188 },
      { name: 'vpip47-pfr34', vpip: 0.757, pfr: 0.6324, af: 2.0292, wtsd: 0.4514 },
      { name: 'vpip47-pfr23', vpip: 0.705, pfr: 0.434, af: 1.871, wtsd: 0.4568 },
      { name: 'vpip64-pfr42', vpip: 0.9079, pfr: 0.7101, af: 1.9969, wtsd: 0.4433 },
      { name: 'vpip75-pfr14', vpip: 0.933, pfr: 0.2373, af: 1.7701, wtsd: 0.4342 },
      { name: 'vpip57-pfr43', vpip: 0.8744, pfr: 0.7522, af: 2.062, wtsd: 0.4469 },
      { name: 'vpip55-pfr35', vpip: 0.8334, pfr: 0.6328, af: 1.9745, wtsd: 0.4475 },
      { name: 'vpip69-pfr28', vpip: 0.9104, pfr: 0.4869, af: 1.8607, wtsd: 0.4379 },
      { name: 'vpip45-pfr17', vpip: 0.6561, pfr: 0.3198, af: 1.8042, wtsd: 0.4656 },
      { name: 'vpip36-pfr25', vpip: 0.5804, pfr: 0.4737, af: 1.9974, wtsd: 0.4723 },
      { name: 'vpip25-pfr14', vpip: 0.3233, pfr: 0.2123, af: 1.7601, wtsd: 0.5223 },
      { name: 'vpip37-pfr9', vpip: 0.5289, pfr: 0.1507, af: 1.7097, wtsd: 0.4861 },
      { name: 'vpip74-pfr21', vpip: 0.9322, pfr: 0.3651, af: 1.8197, wtsd: 0.4317 },
      { name: 'vpip43-pfr25', vpip: 0.6631, pfr: 0.4783, af: 1.9151, wtsd: 0.4649 },
      { name: 'vpip67-pfr37', vpip: 0.9128, pfr: 0.6189, af: 1.9471, wtsd: 0.4396 },
      { name: 'vpip54-pfr11', vpip: 0.7545, pfr: 0.1893, af: 1.7659, wtsd: 0.4568 },
      { name: 'vpip43-pfr13', vpip: 0.6253, pfr: 0.2324, af: 1.764, wtsd: 0.475 },
      { name: 'vpip28-pfr20', vpip: 0.4197, pfr: 0.3496, af: 1.9415, wtsd: 0.4978 },
      { name: 'vpip40-pfr16', vpip: 0.5953, pfr: 0.2924, af: 1.7766, wtsd: 0.4749 },
      { name: 'vpip22-pfr16', vpip: 0.2839, pfr: 0.2416, af: 2.0017, wtsd: 0.5324 },
      { name: 'vpip37-pfr18', vpip: 0.5632, pfr: 0.3418, af: 1.834, wtsd: 0.4769 },
      { name: 'vpip49-pfr14', vpip: 0.7026, pfr: 0.2561, af: 1.7794, wtsd: 0.4611 },
      { name: 'vpip45-pfr32', vpip: 0.7193, pfr: 0.5968, af: 2.0069, wtsd: 0.4572 },
      { name: 'vpip50-pfr30', vpip: 0.7693, pfr: 0.5724, af: 1.9615, wtsd: 0.4528 },
      { name: 'vpip38-pfr23', vpip: 0.5962, pfr: 0.4268, af: 1.8862, wtsd: 0.4747 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.3631, pfr: 0.1926, af: 1.8398, wtsd: 0.4502 },
      { name: 'vpip80-pfr16', vpip: 0.8472, pfr: 0.1697, af: 1.6869, wtsd: 0.3486 },
      { name: 'vpip20-pfr10', vpip: 0.0955, pfr: 0.042, af: 1.7236, wtsd: 0.5359 },
      { name: 'vpip69-pfr53', vpip: 0.689, pfr: 0.6314, af: 2.2144, wtsd: 0.4763 },
      { name: 'vpip47-pfr28', vpip: 0.4312, pfr: 0.3018, af: 1.9628, wtsd: 0.4409 },
      { name: 'vpip60-pfr12', vpip: 0.5579, pfr: 0.0881, af: 1.6516, wtsd: 0.4047 },
      { name: 'vpip79-pfr36', vpip: 0.8014, pfr: 0.4669, af: 1.8939, wtsd: 0.3941 },
      { name: 'vpip41-pfr10', vpip: 0.3233, pfr: 0.0579, af: 1.669, wtsd: 0.4594 },
      { name: 'vpip60-pfr39', vpip: 0.6169, pfr: 0.4972, af: 2.0671, wtsd: 0.4362 },
      { name: 'vpip33-pfr23', vpip: 0.2464, pfr: 0.1911, af: 1.9926, wtsd: 0.4819 },
      { name: 'vpip64-pfr25', vpip: 0.6299, pfr: 0.3006, af: 1.8311, wtsd: 0.4001 },
      { name: 'vpip31-pfr11', vpip: 0.2008, pfr: 0.0619, af: 1.6513, wtsd: 0.4993 },
      { name: 'vpip50-pfr19', vpip: 0.4305, pfr: 0.1701, af: 1.7742, wtsd: 0.4323 },
      { name: 'vpip70-pfr39', vpip: 0.7233, pfr: 0.5322, af: 2.0085, wtsd: 0.4253 },
      { name: 'vpip68-pfr7', vpip: 0.6721, pfr: 0.0341, af: 1.6072, wtsd: 0.3782 },
      { name: 'vpip25-pfr18', vpip: 0.1526, pfr: 0.1204, af: 1.9333, wtsd: 0.5227 },
      { name: 'vpip72-pfr30', vpip: 0.7513, pfr: 0.4157, af: 1.8674, wtsd: 0.3936 },
      { name: 'vpip52-pfr37', vpip: 0.5138, pfr: 0.4374, af: 2.1477, wtsd: 0.4443 },
      { name: 'vpip41-pfr20', vpip: 0.3363, pfr: 0.177, af: 1.836, wtsd: 0.4549 },
      { name: 'vpip70-pfr20', vpip: 0.716, pfr: 0.2321, af: 1.7589, wtsd: 0.375 },
      { name: 'vpip35-pfr30', vpip: 0.301, pfr: 0.2871, af: 2.2481, wtsd: 0.4795 },
      { name: 'vpip78-pfr23', vpip: 0.8238, pfr: 0.3015, af: 1.7642, wtsd: 0.3638 },
      { name: 'vpip58-pfr29', vpip: 0.5597, pfr: 0.3538, af: 1.9082, wtsd: 0.4146 },
      { name: 'vpip61-pfr46', vpip: 0.6465, pfr: 0.5833, af: 2.1806, wtsd: 0.4615 },
      { name: 'vpip48-pfr11', vpip: 0.4048, pfr: 0.068, af: 1.6575, wtsd: 0.4375 },
      { name: 'vpip37-pfr15', vpip: 0.2762, pfr: 0.1106, af: 1.764, wtsd: 0.4697 },
      { name: 'vpip63-pfr17', vpip: 0.615, pfr: 0.1739, af: 1.7123, wtsd: 0.393 },
      { name: 'vpip69-pfr13', vpip: 0.6971, pfr: 0.1164, af: 1.6602, wtsd: 0.376 },
      { name: 'vpip58-pfr22', vpip: 0.5476, pfr: 0.2374, af: 1.8128, wtsd: 0.4105 },
      { name: 'vpip64-pfr34', vpip: 0.6492, pfr: 0.4435, af: 1.9675, wtsd: 0.4173 },
      { name: 'vpip75-pfr43', vpip: 0.7444, pfr: 0.5563, af: 2.0106, wtsd: 0.4314 },
      { name: 'vpip54-pfr15', vpip: 0.488, pfr: 0.1284, af: 1.715, wtsd: 0.4181 },
      { name: 'vpip42-pfr29', vpip: 0.368, pfr: 0.2918, af: 2.0316, wtsd: 0.4528 },
      { name: 'vpip69-pfr47', vpip: 0.706, pfr: 0.6019, af: 2.1311, wtsd: 0.4586 },
      { name: 'vpip53-pfr26', vpip: 0.4986, pfr: 0.2944, af: 1.8954, wtsd: 0.4275 },
      { name: 'vpip31-pfr16', vpip: 0.214, pfr: 0.1157, af: 1.7657, wtsd: 0.4901 },
      { name: 'vpip25-pfr8', vpip: 0.1368, pfr: 0.0327, af: 1.6217, wtsd: 0.5057 },
      { name: 'vpip47-pfr34', vpip: 0.4513, pfr: 0.3701, af: 2.0957, wtsd: 0.4457 },
      { name: 'vpip47-pfr23', vpip: 0.4076, pfr: 0.2231, af: 1.8657, wtsd: 0.4357 },
      { name: 'vpip64-pfr42', vpip: 0.6627, pfr: 0.5523, af: 2.086, wtsd: 0.4435 },
      { name: 'vpip75-pfr14', vpip: 0.782, pfr: 0.1411, af: 1.6778, wtsd: 0.3595 },
      { name: 'vpip57-pfr43', vpip: 0.5988, pfr: 0.5296, af: 2.1651, wtsd: 0.4518 },
      { name: 'vpip55-pfr35', vpip: 0.5477, pfr: 0.4191, af: 2.0489, wtsd: 0.4306 },
      { name: 'vpip69-pfr28', vpip: 0.7018, pfr: 0.3662, af: 1.8448, wtsd: 0.3916 },
      { name: 'vpip45-pfr17', vpip: 0.3688, pfr: 0.1437, af: 1.7725, wtsd: 0.4459 },
      { name: 'vpip36-pfr25', vpip: 0.2954, pfr: 0.2283, af: 1.9898, wtsd: 0.4702 },
      { name: 'vpip25-pfr14', vpip: 0.1423, pfr: 0.0802, af: 1.77, wtsd: 0.5209 },
      { name: 'vpip37-pfr9', vpip: 0.2778, pfr: 0.0528, af: 1.6365, wtsd: 0.4717 },
      { name: 'vpip74-pfr21', vpip: 0.7737, pfr: 0.2646, af: 1.7586, wtsd: 0.3669 },
      { name: 'vpip43-pfr25', vpip: 0.3668, pfr: 0.2462, af: 1.9231, wtsd: 0.4559 },
      { name: 'vpip67-pfr37', vpip: 0.6883, pfr: 0.4928, af: 2.0274, wtsd: 0.4154 },
      { name: 'vpip54-pfr11', vpip: 0.4766, pfr: 0.0761, af: 1.6563, wtsd: 0.4212 },
      { name: 'vpip43-pfr13', vpip: 0.3461, pfr: 0.0922, af: 1.7074, wtsd: 0.4477 },
      { name: 'vpip28-pfr20', vpip: 0.1906, pfr: 0.1498, af: 1.9697, wtsd: 0.5019 },
      { name: 'vpip40-pfr16', vpip: 0.3184, pfr: 0.1249, af: 1.7422, wtsd: 0.4589 },
      { name: 'vpip22-pfr16', vpip: 0.1224, pfr: 0.0958, af: 2.0191, wtsd: 0.5321 },
      { name: 'vpip37-pfr18', vpip: 0.2886, pfr: 0.1509, af: 1.791, wtsd: 0.4684 },
      { name: 'vpip49-pfr14', vpip: 0.4163, pfr: 0.1091, af: 1.7143, wtsd: 0.4369 },
      { name: 'vpip45-pfr32', vpip: 0.4134, pfr: 0.3328, af: 2.0682, wtsd: 0.4488 },
      { name: 'vpip50-pfr30', vpip: 0.4686, pfr: 0.3363, af: 1.9918, wtsd: 0.4366 },
      { name: 'vpip38-pfr23', vpip: 0.3123, pfr: 0.2046, af: 1.8983, wtsd: 0.4659 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2436, pfr: 0.1182, af: 1.7953, wtsd: 0.4541 },
      { name: 'vpip80-pfr16', vpip: 0.7765, pfr: 0.1344, af: 1.6383, wtsd: 0.3285 },
      { name: 'vpip20-pfr10', vpip: 0.0659, pfr: 0.0271, af: 1.5455, wtsd: 0.5125 },
      { name: 'vpip69-pfr53', vpip: 0.5072, pfr: 0.4726, af: 2.2289, wtsd: 0.5459 },
      { name: 'vpip47-pfr28', vpip: 0.3001, pfr: 0.2057, af: 1.9887, wtsd: 0.4505 },
      { name: 'vpip60-pfr12', vpip: 0.4282, pfr: 0.0488, af: 1.6182, wtsd: 0.3815 },
      { name: 'vpip79-pfr36', vpip: 0.6583, pfr: 0.3963, af: 1.9048, wtsd: 0.4248 },
      { name: 'vpip41-pfr10', vpip: 0.2146, pfr: 0.0293, af: 1.6329, wtsd: 0.4494 },
      { name: 'vpip60-pfr39', vpip: 0.4624, pfr: 0.3802, af: 2.1184, wtsd: 0.465 },
      { name: 'vpip33-pfr23', vpip: 0.1522, pfr: 0.1157, af: 1.9383, wtsd: 0.5017 },
      { name: 'vpip64-pfr25', vpip: 0.4976, pfr: 0.2221, af: 1.8299, wtsd: 0.3867 },
      { name: 'vpip31-pfr11', vpip: 0.1282, pfr: 0.0342, af: 1.5894, wtsd: 0.4813 },
      { name: 'vpip50-pfr19', vpip: 0.3063, pfr: 0.1029, af: 1.7366, wtsd: 0.4258 },
      { name: 'vpip70-pfr39', vpip: 0.5597, pfr: 0.4238, af: 2.0433, wtsd: 0.4788 },
      { name: 'vpip68-pfr7', vpip: 0.5475, pfr: 0.0181, af: 1.5535, wtsd: 0.3538 },
      { name: 'vpip25-pfr18', vpip: 0.0967, pfr: 0.0739, af: 1.8588, wtsd: 0.5211 },
      { name: 'vpip72-pfr30', vpip: 0.6153, pfr: 0.3428, af: 1.8628, wtsd: 0.4013 },
      { name: 'vpip52-pfr37', vpip: 0.3717, pfr: 0.3195, af: 2.1567, wtsd: 0.4697 },
      { name: 'vpip41-pfr20', vpip: 0.2216, pfr: 0.1066, af: 1.7784, wtsd: 0.4597 },
      { name: 'vpip70-pfr20', vpip: 0.5995, pfr: 0.1737, af: 1.7304, wtsd: 0.3548 },
      { name: 'vpip35-pfr30', vpip: 0.1927, pfr: 0.1832, af: 2.2784, wtsd: 0.5033 },
      { name: 'vpip78-pfr23', vpip: 0.7266, pfr: 0.2549, af: 1.7306, wtsd: 0.3524 },
      { name: 'vpip58-pfr29', vpip: 0.4225, pfr: 0.2617, af: 1.9754, wtsd: 0.422 },
      { name: 'vpip61-pfr46', vpip: 0.4759, pfr: 0.4373, af: 2.1796, wtsd: 0.5116 },
      { name: 'vpip48-pfr11', vpip: 0.2846, pfr: 0.0338, af: 1.6281, wtsd: 0.4269 },
      { name: 'vpip37-pfr15', vpip: 0.1755, pfr: 0.0622, af: 1.624, wtsd: 0.4742 },
      { name: 'vpip63-pfr17', vpip: 0.4879, pfr: 0.1147, af: 1.6835, wtsd: 0.3754 },
      { name: 'vpip69-pfr13', vpip: 0.5795, pfr: 0.0753, af: 1.6238, wtsd: 0.3525 },
      { name: 'vpip58-pfr22', vpip: 0.4147, pfr: 0.1609, af: 1.7823, wtsd: 0.3977 },
      { name: 'vpip64-pfr34', vpip: 0.501, pfr: 0.346, af: 1.9807, wtsd: 0.4383 },
      { name: 'vpip75-pfr43', vpip: 0.5739, pfr: 0.4442, af: 2.0753, wtsd: 0.4936 },
      { name: 'vpip54-pfr15', vpip: 0.3599, pfr: 0.0733, af: 1.6709, wtsd: 0.404 },
      { name: 'vpip42-pfr29', vpip: 0.2439, pfr: 0.1914, af: 2.0376, wtsd: 0.4789 },
      { name: 'vpip69-pfr47', vpip: 0.5269, pfr: 0.4624, af: 2.162, wtsd: 0.5312 },
      { name: 'vpip53-pfr26', vpip: 0.3651, pfr: 0.2046, af: 1.9001, wtsd: 0.4251 },
      { name: 'vpip31-pfr16', vpip: 0.1321, pfr: 0.0665, af: 1.7027, wtsd: 0.4935 },
      { name: 'vpip25-pfr8', vpip: 0.0912, pfr: 0.0186, af: 1.5359, wtsd: 0.4937 },
      { name: 'vpip47-pfr34', vpip: 0.316, pfr: 0.2608, af: 2.1114, wtsd: 0.4665 },
      { name: 'vpip47-pfr23', vpip: 0.2844, pfr: 0.1434, af: 1.842, wtsd: 0.4389 },
      { name: 'vpip64-pfr42', vpip: 0.4975, pfr: 0.4247, af: 2.1596, wtsd: 0.4919 },
      { name: 'vpip75-pfr14', vpip: 0.6875, pfr: 0.1038, af: 1.6245, wtsd: 0.3378 },
      { name: 'vpip57-pfr43', vpip: 0.4424, pfr: 0.3982, af: 2.2214, wtsd: 0.4876 },
      { name: 'vpip55-pfr35', vpip: 0.4036, pfr: 0.3111, af: 2.0736, wtsd: 0.4486 },
      { name: 'vpip69-pfr28', vpip: 0.5693, pfr: 0.2899, af: 1.8367, wtsd: 0.3915 },
      { name: 'vpip45-pfr17', vpip: 0.2514, pfr: 0.0828, af: 1.7147, wtsd: 0.4439 },
      { name: 'vpip36-pfr25', vpip: 0.1873, pfr: 0.1428, af: 1.9662, wtsd: 0.4869 },
      { name: 'vpip25-pfr14', vpip: 0.0914, pfr: 0.0489, af: 1.612, wtsd: 0.5177 },
      { name: 'vpip37-pfr9', vpip: 0.1794, pfr: 0.0268, af: 1.6174, wtsd: 0.4603 },
      { name: 'vpip74-pfr21', vpip: 0.6679, pfr: 0.2134, af: 1.7137, wtsd: 0.3525 },
      { name: 'vpip43-pfr25', vpip: 0.2438, pfr: 0.1581, af: 1.9024, wtsd: 0.4618 },
      { name: 'vpip67-pfr37', vpip: 0.5341, pfr: 0.3898, af: 2.0475, wtsd: 0.451 },
      { name: 'vpip54-pfr11', vpip: 0.3474, pfr: 0.0394, af: 1.6138, wtsd: 0.4077 },
      { name: 'vpip43-pfr13', vpip: 0.2354, pfr: 0.0496, af: 1.6482, wtsd: 0.4455 },
      { name: 'vpip28-pfr20', vpip: 0.1174, pfr: 0.0898, af: 1.8544, wtsd: 0.515 },
      { name: 'vpip40-pfr16', vpip: 0.2099, pfr: 0.0699, af: 1.6857, wtsd: 0.4587 },
      { name: 'vpip22-pfr16', vpip: 0.0795, pfr: 0.0593, af: 1.8121, wtsd: 0.5292 },
      { name: 'vpip37-pfr18', vpip: 0.1841, pfr: 0.0887, af: 1.7452, wtsd: 0.4704 },
      { name: 'vpip49-pfr14', vpip: 0.2934, pfr: 0.059, af: 1.6613, wtsd: 0.4247 },
      { name: 'vpip45-pfr32', vpip: 0.283, pfr: 0.2277, af: 2.093, wtsd: 0.4673 },
      { name: 'vpip50-pfr30', vpip: 0.3335, pfr: 0.2372, af: 2.0089, wtsd: 0.4486 },
      { name: 'vpip38-pfr23', vpip: 0.2006, pfr: 0.1267, af: 1.8541, wtsd: 0.4753 },
    ],
  },
  '2-50': {
    '2-3p': [
      { name: 'gto', vpip: 0.7079, pfr: 0.4201, af: 1.8919, wtsd: 0.4572 },
      { name: 'vpip80-pfr16', vpip: 0.9607, pfr: 0.2437, af: 1.8524, wtsd: 0.4038 },
      { name: 'vpip20-pfr10', vpip: 0.2859, pfr: 0.1564, af: 1.7469, wtsd: 0.5381 },
      { name: 'vpip69-pfr53', vpip: 0.9255, pfr: 0.7959, af: 2.0702, wtsd: 0.4682 },
      { name: 'vpip47-pfr28', vpip: 0.77, pfr: 0.5588, af: 1.9981, wtsd: 0.4606 },
      { name: 'vpip60-pfr12', vpip: 0.8644, pfr: 0.2072, af: 1.754, wtsd: 0.4284 },
      { name: 'vpip79-pfr36', vpip: 0.9526, pfr: 0.5, af: 1.8414, wtsd: 0.4352 },
      { name: 'vpip41-pfr10', vpip: 0.6655, pfr: 0.1804, af: 1.7324, wtsd: 0.4592 },
      { name: 'vpip60-pfr39', vpip: 0.8893, pfr: 0.6791, af: 1.97, wtsd: 0.46 },
      { name: 'vpip33-pfr23', vpip: 0.5607, pfr: 0.4577, af: 2.1016, wtsd: 0.485 },
      { name: 'vpip64-pfr25', vpip: 0.8966, pfr: 0.4413, af: 1.8695, wtsd: 0.429 },
      { name: 'vpip31-pfr11', vpip: 0.4956, pfr: 0.2012, af: 1.7346, wtsd: 0.4792 },
      { name: 'vpip50-pfr19', vpip: 0.7745, pfr: 0.3597, af: 1.8347, wtsd: 0.4535 },
      { name: 'vpip70-pfr39', vpip: 0.9343, pfr: 0.6144, af: 1.9663, wtsd: 0.4396 },
      { name: 'vpip68-pfr7', vpip: 0.9226, pfr: 0.0946, af: 1.7058, wtsd: 0.4133 },
      { name: 'vpip25-pfr18', vpip: 0.4194, pfr: 0.3483, af: 1.9344, wtsd: 0.5359 },
      { name: 'vpip72-pfr30', vpip: 0.9409, pfr: 0.4819, af: 1.8457, wtsd: 0.4299 },
      { name: 'vpip52-pfr37', vpip: 0.8299, pfr: 0.7015, af: 2.1089, wtsd: 0.4662 },
      { name: 'vpip41-pfr20', vpip: 0.6807, pfr: 0.4009, af: 1.8475, wtsd: 0.4723 },
      { name: 'vpip70-pfr20', vpip: 0.9319, pfr: 0.3476, af: 1.778, wtsd: 0.4186 },
      { name: 'vpip35-pfr30', vpip: 0.6431, pfr: 0.6192, af: 2.2233, wtsd: 0.4824 },
      { name: 'vpip78-pfr23', vpip: 0.9564, pfr: 0.3636, af: 1.7868, wtsd: 0.4225 },
      { name: 'vpip58-pfr29', vpip: 0.8691, pfr: 0.5494, af: 1.9136, wtsd: 0.4468 },
      { name: 'vpip61-pfr46', vpip: 0.906, pfr: 0.7775, af: 2.0401, wtsd: 0.4652 },
      { name: 'vpip48-pfr11', vpip: 0.7535, pfr: 0.1944, af: 1.7692, wtsd: 0.4445 },
      { name: 'vpip37-pfr15', vpip: 0.6002, pfr: 0.2892, af: 1.853, wtsd: 0.4512 },
      { name: 'vpip63-pfr17', vpip: 0.8919, pfr: 0.3156, af: 1.7824, wtsd: 0.4348 },
      { name: 'vpip69-pfr13', vpip: 0.9245, pfr: 0.2277, af: 1.7742, wtsd: 0.4167 },
      { name: 'vpip58-pfr22', vpip: 0.8549, pfr: 0.4121, af: 1.8387, wtsd: 0.4365 },
      { name: 'vpip64-pfr34', vpip: 0.9075, pfr: 0.5871, af: 1.9072, wtsd: 0.4368 },
      { name: 'vpip75-pfr43', vpip: 0.9421, pfr: 0.6214, af: 1.8876, wtsd: 0.4502 },
      { name: 'vpip54-pfr15', vpip: 0.8183, pfr: 0.2867, af: 1.7897, wtsd: 0.4406 },
      { name: 'vpip42-pfr29', vpip: 0.7218, pfr: 0.5954, af: 2.0502, wtsd: 0.4724 },
      { name: 'vpip69-pfr47', vpip: 0.9283, pfr: 0.7229, af: 1.9834, wtsd: 0.4608 },
      { name: 'vpip53-pfr26', vpip: 0.8261, pfr: 0.51, af: 1.8773, wtsd: 0.4473 },
      { name: 'vpip31-pfr16', vpip: 0.5296, pfr: 0.3262, af: 1.8458, wtsd: 0.4802 },
      { name: 'vpip25-pfr8', vpip: 0.3806, pfr: 0.1241, af: 1.6913, wtsd: 0.5038 },
      { name: 'vpip47-pfr34', vpip: 0.7873, pfr: 0.6561, af: 2.0571, wtsd: 0.47 },
      { name: 'vpip47-pfr23', vpip: 0.7573, pfr: 0.4528, af: 1.913, wtsd: 0.4474 },
      { name: 'vpip64-pfr42', vpip: 0.9128, pfr: 0.7021, af: 1.9816, wtsd: 0.4575 },
      { name: 'vpip75-pfr14', vpip: 0.9477, pfr: 0.2331, af: 1.772, wtsd: 0.4145 },
      { name: 'vpip57-pfr43', vpip: 0.8815, pfr: 0.7505, af: 2.0625, wtsd: 0.4636 },
      { name: 'vpip55-pfr35', vpip: 0.8563, pfr: 0.6402, af: 1.9579, wtsd: 0.4597 },
      { name: 'vpip69-pfr28', vpip: 0.9257, pfr: 0.4707, af: 1.8602, wtsd: 0.4309 },
      { name: 'vpip45-pfr17', vpip: 0.7202, pfr: 0.34, af: 1.837, wtsd: 0.4506 },
      { name: 'vpip36-pfr25', vpip: 0.6335, pfr: 0.5127, af: 1.9988, wtsd: 0.4842 },
      { name: 'vpip25-pfr14', vpip: 0.4018, pfr: 0.2535, af: 1.7869, wtsd: 0.5229 },
      { name: 'vpip37-pfr9', vpip: 0.6018, pfr: 0.1695, af: 1.7322, wtsd: 0.4669 },
      { name: 'vpip74-pfr21', vpip: 0.9473, pfr: 0.3446, af: 1.8046, wtsd: 0.4186 },
      { name: 'vpip43-pfr25', vpip: 0.7134, pfr: 0.5065, af: 1.9907, wtsd: 0.4756 },
      { name: 'vpip67-pfr37', vpip: 0.9264, pfr: 0.6068, af: 1.9474, wtsd: 0.4289 },
      { name: 'vpip54-pfr11', vpip: 0.8129, pfr: 0.2032, af: 1.7521, wtsd: 0.4381 },
      { name: 'vpip43-pfr13', vpip: 0.693, pfr: 0.2642, af: 1.8406, wtsd: 0.4386 },
      { name: 'vpip28-pfr20', vpip: 0.4844, pfr: 0.3967, af: 1.9425, wtsd: 0.5117 },
      { name: 'vpip40-pfr16', vpip: 0.6589, pfr: 0.3109, af: 1.7687, wtsd: 0.4742 },
      { name: 'vpip22-pfr16', vpip: 0.3507, pfr: 0.2945, af: 1.9785, wtsd: 0.5554 },
      { name: 'vpip37-pfr18', vpip: 0.6242, pfr: 0.3712, af: 1.8284, wtsd: 0.4783 },
      { name: 'vpip49-pfr14', vpip: 0.7618, pfr: 0.2704, af: 1.7849, wtsd: 0.4457 },
      { name: 'vpip45-pfr32', vpip: 0.7579, pfr: 0.6234, af: 2.0474, wtsd: 0.4765 },
      { name: 'vpip50-pfr30', vpip: 0.8, pfr: 0.5859, af: 1.9736, wtsd: 0.4633 },
      { name: 'vpip38-pfr23', vpip: 0.6546, pfr: 0.4606, af: 1.9344, wtsd: 0.4738 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.4369, pfr: 0.212, af: 1.8006, wtsd: 0.439 },
      { name: 'vpip80-pfr16', vpip: 0.8844, pfr: 0.1357, af: 1.6849, wtsd: 0.3279 },
      { name: 'vpip20-pfr10', vpip: 0.1429, pfr: 0.06, af: 1.6688, wtsd: 0.5037 },
      { name: 'vpip69-pfr53', vpip: 0.7018, pfr: 0.6193, af: 2.1043, wtsd: 0.5098 },
      { name: 'vpip47-pfr28', vpip: 0.4834, pfr: 0.3202, af: 1.9357, wtsd: 0.4411 },
      { name: 'vpip60-pfr12', vpip: 0.6571, pfr: 0.084, af: 1.6167, wtsd: 0.3641 },
      { name: 'vpip79-pfr36', vpip: 0.851, pfr: 0.3872, af: 1.7881, wtsd: 0.3895 },
      { name: 'vpip41-pfr10', vpip: 0.4164, pfr: 0.065, af: 1.6064, wtsd: 0.4152 },
      { name: 'vpip60-pfr39', vpip: 0.6421, pfr: 0.4769, af: 1.993, wtsd: 0.454 },
      { name: 'vpip33-pfr23', vpip: 0.3076, pfr: 0.2368, af: 1.9447, wtsd: 0.5015 },
      { name: 'vpip64-pfr25', vpip: 0.6949, pfr: 0.2598, af: 1.7797, wtsd: 0.383 },
      { name: 'vpip31-pfr11', vpip: 0.2759, pfr: 0.0788, af: 1.6963, wtsd: 0.4625 },
      { name: 'vpip50-pfr19', vpip: 0.517, pfr: 0.1733, af: 1.7219, wtsd: 0.4031 },
      { name: 'vpip70-pfr39', vpip: 0.758, pfr: 0.4795, af: 1.8803, wtsd: 0.4256 },
      { name: 'vpip68-pfr7', vpip: 0.762, pfr: 0.0341, af: 1.5417, wtsd: 0.3446 },
      { name: 'vpip25-pfr18', vpip: 0.2074, pfr: 0.1657, af: 1.949, wtsd: 0.5243 },
      { name: 'vpip72-pfr30', vpip: 0.8008, pfr: 0.346, af: 1.8062, wtsd: 0.3768 },
      { name: 'vpip52-pfr37', vpip: 0.5444, pfr: 0.4498, af: 1.9767, wtsd: 0.4681 },
      { name: 'vpip41-pfr20', vpip: 0.4076, pfr: 0.1988, af: 1.7914, wtsd: 0.4413 },
      { name: 'vpip70-pfr20', vpip: 0.78, pfr: 0.1868, af: 1.6837, wtsd: 0.3538 },
      { name: 'vpip35-pfr30', vpip: 0.354, pfr: 0.3368, af: 2.2108, wtsd: 0.5046 },
      { name: 'vpip78-pfr23', vpip: 0.8712, pfr: 0.2311, af: 1.6763, wtsd: 0.3573 },
      { name: 'vpip58-pfr29', vpip: 0.6163, pfr: 0.3383, af: 1.9589, wtsd: 0.4106 },
      { name: 'vpip61-pfr46', vpip: 0.657, pfr: 0.5718, af: 2.1062, wtsd: 0.4804 },
      { name: 'vpip48-pfr11', vpip: 0.5082, pfr: 0.0728, af: 1.6097, wtsd: 0.3938 },
      { name: 'vpip37-pfr15', vpip: 0.3555, pfr: 0.1326, af: 1.8517, wtsd: 0.4328 },
      { name: 'vpip63-pfr17', vpip: 0.699, pfr: 0.1539, af: 1.6789, wtsd: 0.3717 },
      { name: 'vpip69-pfr13', vpip: 0.7744, pfr: 0.0994, af: 1.6065, wtsd: 0.3515 },
      { name: 'vpip58-pfr22', vpip: 0.621, pfr: 0.219, af: 1.735, wtsd: 0.3876 },
      { name: 'vpip64-pfr34', vpip: 0.6933, pfr: 0.4061, af: 1.9083, wtsd: 0.4173 },
      { name: 'vpip75-pfr43', vpip: 0.7853, pfr: 0.5009, af: 1.8754, wtsd: 0.4336 },
      { name: 'vpip54-pfr15', vpip: 0.5837, pfr: 0.1256, af: 1.6469, wtsd: 0.3864 },
      { name: 'vpip42-pfr29', vpip: 0.4242, pfr: 0.3299, af: 2.0112, wtsd: 0.4804 },
      { name: 'vpip69-pfr47', vpip: 0.7277, pfr: 0.5751, af: 1.9958, wtsd: 0.4677 },
      { name: 'vpip53-pfr26', vpip: 0.5598, pfr: 0.2886, af: 1.8555, wtsd: 0.4117 },
      { name: 'vpip31-pfr16', vpip: 0.2874, pfr: 0.1479, af: 1.8325, wtsd: 0.4525 },
      { name: 'vpip25-pfr8', vpip: 0.2057, pfr: 0.0442, af: 1.6596, wtsd: 0.4659 },
      { name: 'vpip47-pfr34', vpip: 0.4878, pfr: 0.3902, af: 2.0128, wtsd: 0.4639 },
      { name: 'vpip47-pfr23', vpip: 0.4786, pfr: 0.2375, af: 1.8379, wtsd: 0.4277 },
      { name: 'vpip64-pfr42', vpip: 0.6855, pfr: 0.5262, af: 2.0071, wtsd: 0.4484 },
      { name: 'vpip75-pfr14', vpip: 0.8393, pfr: 0.1152, af: 1.6344, wtsd: 0.3433 },
      { name: 'vpip57-pfr43', vpip: 0.6136, pfr: 0.5234, af: 2.0875, wtsd: 0.4697 },
      { name: 'vpip55-pfr35', vpip: 0.583, pfr: 0.4145, af: 1.9623, wtsd: 0.4425 },
      { name: 'vpip69-pfr28', vpip: 0.7551, pfr: 0.3041, af: 1.7539, wtsd: 0.3816 },
      { name: 'vpip45-pfr17', vpip: 0.4546, pfr: 0.1513, af: 1.6959, wtsd: 0.4167 },
      { name: 'vpip36-pfr25', vpip: 0.3547, pfr: 0.2706, af: 1.9975, wtsd: 0.4763 },
      { name: 'vpip25-pfr14', vpip: 0.2048, pfr: 0.1121, af: 1.7267, wtsd: 0.4954 },
      { name: 'vpip37-pfr9', vpip: 0.3703, pfr: 0.0634, af: 1.6575, wtsd: 0.4234 },
      { name: 'vpip74-pfr21', vpip: 0.8288, pfr: 0.209, af: 1.6615, wtsd: 0.3553 },
      { name: 'vpip43-pfr25', vpip: 0.4251, pfr: 0.2732, af: 1.9002, wtsd: 0.4477 },
      { name: 'vpip67-pfr37', vpip: 0.7261, pfr: 0.4432, af: 1.8677, wtsd: 0.4128 },
      { name: 'vpip54-pfr11', vpip: 0.5804, pfr: 0.0757, af: 1.5872, wtsd: 0.3817 },
      { name: 'vpip43-pfr13', vpip: 0.4396, pfr: 0.1052, af: 1.7265, wtsd: 0.4156 },
      { name: 'vpip28-pfr20', vpip: 0.2487, pfr: 0.1947, af: 2.0532, wtsd: 0.5009 },
      { name: 'vpip40-pfr16', vpip: 0.3998, pfr: 0.1386, af: 1.7116, wtsd: 0.4283 },
      { name: 'vpip22-pfr16', vpip: 0.1735, pfr: 0.1378, af: 1.9697, wtsd: 0.5472 },
      { name: 'vpip37-pfr18', vpip: 0.3609, pfr: 0.1775, af: 1.7526, wtsd: 0.4537 },
      { name: 'vpip49-pfr14', vpip: 0.5104, pfr: 0.1121, af: 1.6768, wtsd: 0.393 },
      { name: 'vpip45-pfr32', vpip: 0.4604, pfr: 0.3627, af: 2.0365, wtsd: 0.4688 },
      { name: 'vpip50-pfr30', vpip: 0.5177, pfr: 0.3465, af: 1.9267, wtsd: 0.443 },
      { name: 'vpip38-pfr23', vpip: 0.3772, pfr: 0.2403, af: 1.8966, wtsd: 0.4618 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.3207, pfr: 0.1316, af: 1.7304, wtsd: 0.4485 },
      { name: 'vpip80-pfr16', vpip: 0.8437, pfr: 0.0949, af: 1.5486, wtsd: 0.3157 },
      { name: 'vpip20-pfr10', vpip: 0.1076, pfr: 0.0409, af: 1.5009, wtsd: 0.5113 },
      { name: 'vpip69-pfr53', vpip: 0.5343, pfr: 0.4643, af: 2.0763, wtsd: 0.634 },
      { name: 'vpip47-pfr28', vpip: 0.3551, pfr: 0.2118, af: 1.8906, wtsd: 0.4752 },
      { name: 'vpip60-pfr12', vpip: 0.5507, pfr: 0.0489, af: 1.5291, wtsd: 0.3549 },
      { name: 'vpip79-pfr36', vpip: 0.7566, pfr: 0.3175, af: 1.7085, wtsd: 0.4167 },
      { name: 'vpip41-pfr10', vpip: 0.311, pfr: 0.0369, af: 1.5581, wtsd: 0.4109 },
      { name: 'vpip60-pfr39', vpip: 0.4978, pfr: 0.3515, af: 1.9631, wtsd: 0.5148 },
      { name: 'vpip33-pfr23', vpip: 0.2074, pfr: 0.1554, af: 2.0706, wtsd: 0.499 },
      { name: 'vpip64-pfr25', vpip: 0.5873, pfr: 0.1784, af: 1.6469, wtsd: 0.3925 },
      { name: 'vpip31-pfr11', vpip: 0.203, pfr: 0.0468, af: 1.6115, wtsd: 0.4524 },
      { name: 'vpip50-pfr19', vpip: 0.404, pfr: 0.1044, af: 1.6219, wtsd: 0.4134 },
      { name: 'vpip70-pfr39', vpip: 0.6276, pfr: 0.3725, af: 1.8671, wtsd: 0.4883 },
      { name: 'vpip68-pfr7', vpip: 0.6676, pfr: 0.0213, af: 1.4727, wtsd: 0.322 },
      { name: 'vpip25-pfr18', vpip: 0.1462, pfr: 0.111, af: 1.953, wtsd: 0.5611 },
      { name: 'vpip72-pfr30', vpip: 0.7007, pfr: 0.2697, af: 1.7259, wtsd: 0.4013 },
      { name: 'vpip52-pfr37', vpip: 0.4012, pfr: 0.3184, af: 2.024, wtsd: 0.5176 },
      { name: 'vpip41-pfr20', vpip: 0.2968, pfr: 0.1234, af: 1.736, wtsd: 0.4615 },
      { name: 'vpip70-pfr20', vpip: 0.703, pfr: 0.1303, af: 1.5599, wtsd: 0.3523 },
      { name: 'vpip35-pfr30', vpip: 0.2373, pfr: 0.2236, af: 2.3392, wtsd: 0.5555 },
      { name: 'vpip78-pfr23', vpip: 0.8047, pfr: 0.1779, af: 1.6232, wtsd: 0.347 },
      { name: 'vpip58-pfr29', vpip: 0.4922, pfr: 0.2326, af: 1.8602, wtsd: 0.4081 },
      { name: 'vpip61-pfr46', vpip: 0.4972, pfr: 0.4233, af: 2.0569, wtsd: 0.5833 },
      { name: 'vpip48-pfr11', vpip: 0.3979, pfr: 0.0406, af: 1.5425, wtsd: 0.3924 },
      { name: 'vpip37-pfr15', vpip: 0.2534, pfr: 0.0804, af: 1.7356, wtsd: 0.4513 },
      { name: 'vpip63-pfr17', vpip: 0.5951, pfr: 0.0956, af: 1.5512, wtsd: 0.3595 },
      { name: 'vpip69-pfr13', vpip: 0.6854, pfr: 0.0623, af: 1.5231, wtsd: 0.3395 },
      { name: 'vpip58-pfr22', vpip: 0.5099, pfr: 0.1389, af: 1.6517, wtsd: 0.3973 },
      { name: 'vpip64-pfr34', vpip: 0.5615, pfr: 0.2985, af: 1.8222, wtsd: 0.4418 },
      { name: 'vpip75-pfr43', vpip: 0.6494, pfr: 0.4017, af: 1.8703, wtsd: 0.5114 },
      { name: 'vpip54-pfr15', vpip: 0.4704, pfr: 0.0719, af: 1.5667, wtsd: 0.3815 },
      { name: 'vpip42-pfr29', vpip: 0.2931, pfr: 0.2153, af: 2.0873, wtsd: 0.5052 },
      { name: 'vpip69-pfr47', vpip: 0.5723, pfr: 0.4413, af: 2.026, wtsd: 0.591 },
      { name: 'vpip53-pfr26', vpip: 0.4376, pfr: 0.192, af: 1.7801, wtsd: 0.4359 },
      { name: 'vpip31-pfr16', vpip: 0.1979, pfr: 0.0918, af: 1.6675, wtsd: 0.4717 },
      { name: 'vpip25-pfr8', vpip: 0.1529, pfr: 0.0264, af: 1.5671, wtsd: 0.4514 },
      { name: 'vpip47-pfr34', vpip: 0.3531, pfr: 0.2703, af: 2.0665, wtsd: 0.5172 },
      { name: 'vpip47-pfr23', vpip: 0.3583, pfr: 0.152, af: 1.8147, wtsd: 0.4338 },
      { name: 'vpip64-pfr42', vpip: 0.5356, pfr: 0.3931, af: 2.0188, wtsd: 0.5419 },
      { name: 'vpip75-pfr14', vpip: 0.7739, pfr: 0.0789, af: 1.5205, wtsd: 0.3302 },
      { name: 'vpip57-pfr43', vpip: 0.4595, pfr: 0.3807, af: 2.096, wtsd: 0.5447 },
      { name: 'vpip55-pfr35', vpip: 0.4455, pfr: 0.292, af: 1.9651, wtsd: 0.4866 },
      { name: 'vpip69-pfr28', vpip: 0.6482, pfr: 0.2273, af: 1.6817, wtsd: 0.398 },
      { name: 'vpip45-pfr17', vpip: 0.3432, pfr: 0.0912, af: 1.6277, wtsd: 0.4302 },
      { name: 'vpip36-pfr25', vpip: 0.2432, pfr: 0.1783, af: 2.0036, wtsd: 0.5218 },
      { name: 'vpip25-pfr14', vpip: 0.145, pfr: 0.0736, af: 1.6888, wtsd: 0.5127 },
      { name: 'vpip37-pfr9', vpip: 0.268, pfr: 0.0349, af: 1.562, wtsd: 0.4197 },
      { name: 'vpip74-pfr21', vpip: 0.7518, pfr: 0.1543, af: 1.5999, wtsd: 0.3499 },
      { name: 'vpip43-pfr25', vpip: 0.308, pfr: 0.1792, af: 1.8452, wtsd: 0.4881 },
      { name: 'vpip67-pfr37', vpip: 0.5972, pfr: 0.3404, af: 1.9067, wtsd: 0.4568 },
      { name: 'vpip54-pfr11', vpip: 0.4663, pfr: 0.0429, af: 1.5117, wtsd: 0.3749 },
      { name: 'vpip43-pfr13', vpip: 0.3326, pfr: 0.0556, af: 1.6018, wtsd: 0.392 },
      { name: 'vpip28-pfr20', vpip: 0.1706, pfr: 0.1282, af: 1.9158, wtsd: 0.5458 },
      { name: 'vpip40-pfr16', vpip: 0.2959, pfr: 0.0826, af: 1.6362, wtsd: 0.4439 },
      { name: 'vpip22-pfr16', vpip: 0.1237, pfr: 0.094, af: 1.8714, wtsd: 0.564 },
      { name: 'vpip37-pfr18', vpip: 0.2569, pfr: 0.1115, af: 1.717, wtsd: 0.4755 },
      { name: 'vpip49-pfr14', vpip: 0.4011, pfr: 0.0628, af: 1.5766, wtsd: 0.3964 },
      { name: 'vpip45-pfr32', vpip: 0.3269, pfr: 0.2457, af: 2.0992, wtsd: 0.5103 },
      { name: 'vpip50-pfr30', vpip: 0.3852, pfr: 0.2358, af: 1.9005, wtsd: 0.4797 },
      { name: 'vpip38-pfr23', vpip: 0.265, pfr: 0.1537, af: 1.8945, wtsd: 0.4937 },
    ],
  },
  '2-100': {
    '2-3p': [
      { name: 'gto', vpip: 0.7703, pfr: 0.4151, af: 1.8645, wtsd: 0.4512 },
      { name: 'vpip80-pfr16', vpip: 0.9742, pfr: 0.2088, af: 1.7398, wtsd: 0.4072 },
      { name: 'vpip20-pfr10', vpip: 0.3535, pfr: 0.1731, af: 1.7265, wtsd: 0.5183 },
      { name: 'vpip69-pfr53', vpip: 0.9367, pfr: 0.787, af: 2.0267, wtsd: 0.475 },
      { name: 'vpip47-pfr28', vpip: 0.817, pfr: 0.5615, af: 1.9433, wtsd: 0.4609 },
      { name: 'vpip60-pfr12', vpip: 0.9144, pfr: 0.1841, af: 1.7279, wtsd: 0.4168 },
      { name: 'vpip79-pfr36', vpip: 0.9688, pfr: 0.4374, af: 1.8145, wtsd: 0.4253 },
      { name: 'vpip41-pfr10', vpip: 0.7552, pfr: 0.1659, af: 1.7377, wtsd: 0.4406 },
      { name: 'vpip60-pfr39', vpip: 0.9131, pfr: 0.6595, af: 1.9526, wtsd: 0.451 },
      { name: 'vpip33-pfr23', vpip: 0.6258, pfr: 0.4977, af: 2.0008, wtsd: 0.4925 },
      { name: 'vpip64-pfr25', vpip: 0.929, pfr: 0.3976, af: 1.8034, wtsd: 0.425 },
      { name: 'vpip31-pfr11', vpip: 0.5801, pfr: 0.1989, af: 1.7432, wtsd: 0.4674 },
      { name: 'vpip50-pfr19', vpip: 0.839, pfr: 0.3432, af: 1.809, wtsd: 0.4361 },
      { name: 'vpip70-pfr39', vpip: 0.9516, pfr: 0.5671, af: 1.8832, wtsd: 0.4346 },
      { name: 'vpip68-pfr7', vpip: 0.9483, pfr: 0.083, af: 1.6976, wtsd: 0.4096 },
      { name: 'vpip25-pfr18', vpip: 0.4786, pfr: 0.3884, af: 1.9504, wtsd: 0.5277 },
      { name: 'vpip72-pfr30', vpip: 0.9595, pfr: 0.4258, af: 1.8098, wtsd: 0.4211 },
      { name: 'vpip52-pfr37', vpip: 0.8583, pfr: 0.7059, af: 2.0501, wtsd: 0.464 },
      { name: 'vpip41-pfr20', vpip: 0.7464, pfr: 0.4026, af: 1.869, wtsd: 0.4544 },
      { name: 'vpip70-pfr20', vpip: 0.9532, pfr: 0.2919, af: 1.783, wtsd: 0.4118 },
      { name: 'vpip35-pfr30', vpip: 0.6865, pfr: 0.6565, af: 2.1781, wtsd: 0.5045 },
      { name: 'vpip78-pfr23', vpip: 0.9713, pfr: 0.3054, af: 1.7612, wtsd: 0.4146 },
      { name: 'vpip58-pfr29', vpip: 0.899, pfr: 0.5146, af: 1.8735, wtsd: 0.4394 },
      { name: 'vpip61-pfr46', vpip: 0.9192, pfr: 0.7701, af: 2.0262, wtsd: 0.4699 },
      { name: 'vpip48-pfr11', vpip: 0.8341, pfr: 0.1736, af: 1.7347, wtsd: 0.4286 },
      { name: 'vpip37-pfr15', vpip: 0.6829, pfr: 0.2911, af: 1.7944, wtsd: 0.4544 },
      { name: 'vpip63-pfr17', vpip: 0.9284, pfr: 0.2746, af: 1.773, wtsd: 0.4172 },
      { name: 'vpip69-pfr13', vpip: 0.9495, pfr: 0.1913, af: 1.729, wtsd: 0.4099 },
      { name: 'vpip58-pfr22', vpip: 0.8999, pfr: 0.3762, af: 1.8111, wtsd: 0.4277 },
      { name: 'vpip64-pfr34', vpip: 0.9302, pfr: 0.5423, af: 1.8797, wtsd: 0.4366 },
      { name: 'vpip75-pfr43', vpip: 0.9568, pfr: 0.5737, af: 1.8846, wtsd: 0.4395 },
      { name: 'vpip54-pfr15', vpip: 0.879, pfr: 0.2574, af: 1.7612, wtsd: 0.4249 },
      { name: 'vpip42-pfr29', vpip: 0.7548, pfr: 0.6041, af: 2.0059, wtsd: 0.4794 },
      { name: 'vpip69-pfr47', vpip: 0.9436, pfr: 0.6933, af: 1.9356, wtsd: 0.454 },
      { name: 'vpip53-pfr26', vpip: 0.8687, pfr: 0.4835, af: 1.8758, wtsd: 0.4405 },
      { name: 'vpip31-pfr16', vpip: 0.5901, pfr: 0.3351, af: 1.8169, wtsd: 0.4787 },
      { name: 'vpip25-pfr8', vpip: 0.4672, pfr: 0.122, af: 1.6801, wtsd: 0.4795 },
      { name: 'vpip47-pfr34', vpip: 0.8226, pfr: 0.6676, af: 2.013, wtsd: 0.4724 },
      { name: 'vpip47-pfr23', vpip: 0.8114, pfr: 0.4427, af: 1.8961, wtsd: 0.4426 },
      { name: 'vpip64-pfr42', vpip: 0.931, pfr: 0.6805, af: 1.9567, wtsd: 0.4494 },
      { name: 'vpip75-pfr14', vpip: 0.9652, pfr: 0.1989, af: 1.7293, wtsd: 0.4079 },
      { name: 'vpip57-pfr43', vpip: 0.9001, pfr: 0.7489, af: 2.0183, wtsd: 0.4692 },
      { name: 'vpip55-pfr35', vpip: 0.8835, pfr: 0.6274, af: 1.9556, wtsd: 0.4539 },
      { name: 'vpip69-pfr28', vpip: 0.9482, pfr: 0.4157, af: 1.818, wtsd: 0.4218 },
      { name: 'vpip45-pfr17', vpip: 0.7895, pfr: 0.3246, af: 1.811, wtsd: 0.4428 },
      { name: 'vpip36-pfr25', vpip: 0.688, pfr: 0.5441, af: 1.9947, wtsd: 0.4854 },
      { name: 'vpip25-pfr14', vpip: 0.4691, pfr: 0.278, af: 1.7864, wtsd: 0.5061 },
      { name: 'vpip37-pfr9', vpip: 0.6972, pfr: 0.1606, af: 1.7138, wtsd: 0.4483 },
      { name: 'vpip74-pfr21', vpip: 0.9632, pfr: 0.2993, af: 1.7677, wtsd: 0.4135 },
      { name: 'vpip43-pfr25', vpip: 0.7645, pfr: 0.5177, af: 1.9318, wtsd: 0.466 },
      { name: 'vpip67-pfr37', vpip: 0.9414, pfr: 0.5591, af: 1.8894, wtsd: 0.4322 },
      { name: 'vpip54-pfr11', vpip: 0.8797, pfr: 0.1798, af: 1.7325, wtsd: 0.4215 },
      { name: 'vpip43-pfr13', vpip: 0.7782, pfr: 0.24, af: 1.7899, wtsd: 0.4356 },
      { name: 'vpip28-pfr20', vpip: 0.5447, pfr: 0.4364, af: 1.9471, wtsd: 0.5118 },
      { name: 'vpip40-pfr16', vpip: 0.7382, pfr: 0.3068, af: 1.7854, wtsd: 0.4531 },
      { name: 'vpip22-pfr16', vpip: 0.4093, pfr: 0.3353, af: 1.9674, wtsd: 0.5485 },
      { name: 'vpip37-pfr18', vpip: 0.6939, pfr: 0.3765, af: 1.8382, wtsd: 0.4654 },
      { name: 'vpip49-pfr14', vpip: 0.8347, pfr: 0.2473, af: 1.7779, wtsd: 0.4297 },
      { name: 'vpip45-pfr32', vpip: 0.796, pfr: 0.6414, af: 2.0408, wtsd: 0.4721 },
      { name: 'vpip50-pfr30', vpip: 0.8417, pfr: 0.5866, af: 1.9472, wtsd: 0.4557 },
      { name: 'vpip38-pfr23', vpip: 0.7118, pfr: 0.4795, af: 1.911, wtsd: 0.4731 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.5255, pfr: 0.2019, af: 1.7212, wtsd: 0.4303 },
      { name: 'vpip80-pfr16', vpip: 0.9243, pfr: 0.1022, af: 1.5421, wtsd: 0.3305 },
      { name: 'vpip20-pfr10', vpip: 0.2019, pfr: 0.0732, af: 1.6747, wtsd: 0.4864 },
      { name: 'vpip69-pfr53', vpip: 0.7407, pfr: 0.6013, af: 2.0063, wtsd: 0.533 },
      { name: 'vpip47-pfr28', vpip: 0.5542, pfr: 0.3094, af: 1.8555, wtsd: 0.4472 },
      { name: 'vpip60-pfr12', vpip: 0.7577, pfr: 0.0727, af: 1.522, wtsd: 0.353 },
      { name: 'vpip79-pfr36', vpip: 0.9051, pfr: 0.2987, af: 1.6591, wtsd: 0.3781 },
      { name: 'vpip41-pfr10', vpip: 0.5278, pfr: 0.0617, af: 1.5464, wtsd: 0.3974 },
      { name: 'vpip60-pfr39', vpip: 0.6976, pfr: 0.4351, af: 1.8672, wtsd: 0.4489 },
      { name: 'vpip33-pfr23', vpip: 0.362, pfr: 0.2626, af: 1.987, wtsd: 0.5048 },
      { name: 'vpip64-pfr25', vpip: 0.779, pfr: 0.2082, af: 1.6304, wtsd: 0.3727 },
      { name: 'vpip31-pfr11', vpip: 0.3662, pfr: 0.0784, af: 1.6209, wtsd: 0.4413 },
      { name: 'vpip50-pfr19', vpip: 0.6227, pfr: 0.1519, af: 1.6149, wtsd: 0.3927 },
      { name: 'vpip70-pfr39', vpip: 0.8229, pfr: 0.3975, af: 1.7386, wtsd: 0.4106 },
      { name: 'vpip68-pfr7', vpip: 0.8383, pfr: 0.0353, af: 1.4858, wtsd: 0.3331 },
      { name: 'vpip25-pfr18', vpip: 0.2613, pfr: 0.1986, af: 1.9611, wtsd: 0.5337 },
      { name: 'vpip72-pfr30', vpip: 0.8634, pfr: 0.2619, af: 1.6502, wtsd: 0.3674 },
      { name: 'vpip52-pfr37', vpip: 0.5838, pfr: 0.4392, af: 2.0183, wtsd: 0.479 },
      { name: 'vpip41-pfr20', vpip: 0.497, pfr: 0.1931, af: 1.7162, wtsd: 0.4331 },
      { name: 'vpip70-pfr20', vpip: 0.8499, pfr: 0.1429, af: 1.5928, wtsd: 0.3454 },
      { name: 'vpip35-pfr30', vpip: 0.392, pfr: 0.3692, af: 2.2587, wtsd: 0.5351 },
      { name: 'vpip78-pfr23', vpip: 0.9151, pfr: 0.1695, af: 1.5801, wtsd: 0.3464 },
      { name: 'vpip58-pfr29', vpip: 0.6929, pfr: 0.292, af: 1.7421, wtsd: 0.4045 },
      { name: 'vpip61-pfr46', vpip: 0.6903, pfr: 0.5479, af: 1.9997, wtsd: 0.5053 },
      { name: 'vpip48-pfr11', vpip: 0.6243, pfr: 0.0659, af: 1.5398, wtsd: 0.3729 },
      { name: 'vpip37-pfr15', vpip: 0.4469, pfr: 0.1262, af: 1.6707, wtsd: 0.4274 },
      { name: 'vpip63-pfr17', vpip: 0.7889, pfr: 0.1225, af: 1.5548, wtsd: 0.3572 },
      { name: 'vpip69-pfr13', vpip: 0.8461, pfr: 0.0818, af: 1.5264, wtsd: 0.3414 },
      { name: 'vpip58-pfr22', vpip: 0.7201, pfr: 0.1823, af: 1.6233, wtsd: 0.3783 },
      { name: 'vpip64-pfr34', vpip: 0.7605, pfr: 0.3406, af: 1.7407, wtsd: 0.4059 },
      { name: 'vpip75-pfr43', vpip: 0.8486, pfr: 0.4213, af: 1.7495, wtsd: 0.4214 },
      { name: 'vpip54-pfr15', vpip: 0.6933, pfr: 0.1062, af: 1.5656, wtsd: 0.3686 },
      { name: 'vpip42-pfr29', vpip: 0.4719, pfr: 0.3383, af: 2.0124, wtsd: 0.4894 },
      { name: 'vpip69-pfr47', vpip: 0.7818, pfr: 0.5238, af: 1.8739, wtsd: 0.4746 },
      { name: 'vpip53-pfr26', vpip: 0.6476, pfr: 0.2555, af: 1.7282, wtsd: 0.4077 },
      { name: 'vpip31-pfr16', vpip: 0.3554, pfr: 0.1585, af: 1.7599, wtsd: 0.464 },
      { name: 'vpip25-pfr8', vpip: 0.2865, pfr: 0.0473, af: 1.6048, wtsd: 0.4452 },
      { name: 'vpip47-pfr34', vpip: 0.5381, pfr: 0.3929, af: 1.9959, wtsd: 0.4818 },
      { name: 'vpip47-pfr23', vpip: 0.5706, pfr: 0.2185, af: 1.7487, wtsd: 0.4181 },
      { name: 'vpip64-pfr42', vpip: 0.7361, pfr: 0.4769, af: 1.8674, wtsd: 0.457 },
      { name: 'vpip75-pfr14', vpip: 0.8935, pfr: 0.091, af: 1.5345, wtsd: 0.335 },
      { name: 'vpip57-pfr43', vpip: 0.6496, pfr: 0.5036, af: 1.9982, wtsd: 0.4899 },
      { name: 'vpip55-pfr35', vpip: 0.6446, pfr: 0.382, af: 1.8582, wtsd: 0.4429 },
      { name: 'vpip69-pfr28', vpip: 0.8279, pfr: 0.2378, af: 1.6395, wtsd: 0.3713 },
      { name: 'vpip45-pfr17', vpip: 0.5597, pfr: 0.1409, af: 1.633, wtsd: 0.4054 },
      { name: 'vpip36-pfr25', vpip: 0.4097, pfr: 0.2917, af: 1.9814, wtsd: 0.4891 },
      { name: 'vpip25-pfr14', vpip: 0.2682, pfr: 0.1284, af: 1.7317, wtsd: 0.4908 },
      { name: 'vpip37-pfr9', vpip: 0.4684, pfr: 0.0597, af: 1.5622, wtsd: 0.4063 },
      { name: 'vpip74-pfr21', vpip: 0.8855, pfr: 0.1563, af: 1.5717, wtsd: 0.3481 },
      { name: 'vpip43-pfr25', vpip: 0.4979, pfr: 0.2726, af: 1.8439, wtsd: 0.4524 },
      { name: 'vpip67-pfr37', vpip: 0.792, pfr: 0.3742, af: 1.7374, wtsd: 0.4114 },
      { name: 'vpip54-pfr11', vpip: 0.6919, pfr: 0.0684, af: 1.5234, wtsd: 0.3612 },
      { name: 'vpip43-pfr13', vpip: 0.5501, pfr: 0.0946, af: 1.5672, wtsd: 0.3962 },
      { name: 'vpip28-pfr20', vpip: 0.3035, pfr: 0.2259, af: 1.9967, wtsd: 0.5194 },
      { name: 'vpip40-pfr16', vpip: 0.5006, pfr: 0.132, af: 1.6465, wtsd: 0.4178 },
      { name: 'vpip22-pfr16', vpip: 0.2213, pfr: 0.1691, af: 1.9832, wtsd: 0.5454 },
      { name: 'vpip37-pfr18', vpip: 0.4455, pfr: 0.1791, af: 1.7194, wtsd: 0.4459 },
      { name: 'vpip49-pfr14', vpip: 0.627, pfr: 0.0985, af: 1.5728, wtsd: 0.3831 },
      { name: 'vpip45-pfr32', vpip: 0.5102, pfr: 0.3678, af: 2.0224, wtsd: 0.4779 },
      { name: 'vpip50-pfr30', vpip: 0.5847, pfr: 0.3318, af: 1.8439, wtsd: 0.4451 },
      { name: 'vpip38-pfr23', vpip: 0.4465, pfr: 0.2465, af: 1.8449, wtsd: 0.4629 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.4138, pfr: 0.1277, af: 1.5978, wtsd: 0.4275 },
      { name: 'vpip80-pfr16', vpip: 0.8902, pfr: 0.0782, af: 1.3966, wtsd: 0.3007 },
      { name: 'vpip20-pfr10', vpip: 0.1531, pfr: 0.0508, af: 1.5247, wtsd: 0.4885 },
      { name: 'vpip69-pfr53', vpip: 0.5798, pfr: 0.453, af: 1.9996, wtsd: 0.6469 },
      { name: 'vpip47-pfr28', vpip: 0.4315, pfr: 0.2061, af: 1.7641, wtsd: 0.4649 },
      { name: 'vpip60-pfr12', vpip: 0.6624, pfr: 0.0493, af: 1.3822, wtsd: 0.327 },
      { name: 'vpip79-pfr36', vpip: 0.8431, pfr: 0.2424, af: 1.543, wtsd: 0.3693 },
      { name: 'vpip41-pfr10', vpip: 0.415, pfr: 0.0403, af: 1.4032, wtsd: 0.3809 },
      { name: 'vpip60-pfr39', vpip: 0.5652, pfr: 0.3183, af: 1.7862, wtsd: 0.4872 },
      { name: 'vpip33-pfr23', vpip: 0.2575, pfr: 0.1737, af: 2.0146, wtsd: 0.5497 },
      { name: 'vpip64-pfr25', vpip: 0.6877, pfr: 0.1464, af: 1.4958, wtsd: 0.3574 },
      { name: 'vpip31-pfr11', vpip: 0.2765, pfr: 0.0523, af: 1.4693, wtsd: 0.4364 },
      { name: 'vpip50-pfr19', vpip: 0.5128, pfr: 0.0967, af: 1.4874, wtsd: 0.3806 },
      { name: 'vpip70-pfr39', vpip: 0.7165, pfr: 0.3108, af: 1.6478, wtsd: 0.4308 },
      { name: 'vpip68-pfr7', vpip: 0.7636, pfr: 0.0243, af: 1.3396, wtsd: 0.2953 },
      { name: 'vpip25-pfr18', vpip: 0.185, pfr: 0.133, af: 1.9623, wtsd: 0.5709 },
      { name: 'vpip72-pfr30', vpip: 0.7902, pfr: 0.2034, af: 1.519, wtsd: 0.3581 },
      { name: 'vpip52-pfr37', vpip: 0.4465, pfr: 0.3089, af: 2.0001, wtsd: 0.5352 },
      { name: 'vpip41-pfr20', vpip: 0.3865, pfr: 0.1218, af: 1.606, wtsd: 0.4342 },
      { name: 'vpip70-pfr20', vpip: 0.7828, pfr: 0.1051, af: 1.4561, wtsd: 0.3249 },
      { name: 'vpip35-pfr30', vpip: 0.2684, pfr: 0.2491, af: 2.3081, wtsd: 0.5959 },
      { name: 'vpip78-pfr23', vpip: 0.8705, pfr: 0.1321, af: 1.4515, wtsd: 0.3202 },
      { name: 'vpip58-pfr29', vpip: 0.5806, pfr: 0.2006, af: 1.6309, wtsd: 0.4102 },
      { name: 'vpip61-pfr46', vpip: 0.5371, pfr: 0.4038, af: 1.9574, wtsd: 0.5918 },
      { name: 'vpip48-pfr11', vpip: 0.511, pfr: 0.0431, af: 1.3885, wtsd: 0.3555 },
      { name: 'vpip37-pfr15', vpip: 0.3434, pfr: 0.0792, af: 1.539, wtsd: 0.4307 },
      { name: 'vpip63-pfr17', vpip: 0.7025, pfr: 0.0836, af: 1.4218, wtsd: 0.3321 },
      { name: 'vpip69-pfr13', vpip: 0.7785, pfr: 0.0584, af: 1.3826, wtsd: 0.3097 },
      { name: 'vpip58-pfr22', vpip: 0.618, pfr: 0.1204, af: 1.4894, wtsd: 0.364 },
      { name: 'vpip64-pfr34', vpip: 0.6524, pfr: 0.2491, af: 1.6335, wtsd: 0.4101 },
      { name: 'vpip75-pfr43', vpip: 0.7434, pfr: 0.3375, af: 1.6521, wtsd: 0.4467 },
      { name: 'vpip54-pfr15', vpip: 0.5869, pfr: 0.0681, af: 1.4182, wtsd: 0.351 },
      { name: 'vpip42-pfr29', vpip: 0.3461, pfr: 0.2249, af: 1.9917, wtsd: 0.5242 },
      { name: 'vpip69-pfr47', vpip: 0.6428, pfr: 0.4052, af: 1.8367, wtsd: 0.5472 },
      { name: 'vpip53-pfr26', vpip: 0.5333, pfr: 0.169, af: 1.5921, wtsd: 0.4065 },
      { name: 'vpip31-pfr16', vpip: 0.2645, pfr: 0.1017, af: 1.6807, wtsd: 0.4748 },
      { name: 'vpip25-pfr8', vpip: 0.2175, pfr: 0.032, af: 1.4479, wtsd: 0.4371 },
      { name: 'vpip47-pfr34', vpip: 0.4055, pfr: 0.2696, af: 1.9513, wtsd: 0.5254 },
      { name: 'vpip47-pfr23', vpip: 0.4571, pfr: 0.1416, af: 1.5977, wtsd: 0.4217 },
      { name: 'vpip64-pfr42', vpip: 0.6026, pfr: 0.3584, af: 1.8064, wtsd: 0.5104 },
      { name: 'vpip75-pfr14', vpip: 0.8453, pfr: 0.0663, af: 1.3898, wtsd: 0.3003 },
      { name: 'vpip57-pfr43', vpip: 0.5041, pfr: 0.3664, af: 1.9538, wtsd: 0.564 },
      { name: 'vpip55-pfr35', vpip: 0.5152, pfr: 0.2681, af: 1.788, wtsd: 0.4686 },
      { name: 'vpip69-pfr28', vpip: 0.747, pfr: 0.1763, af: 1.5208, wtsd: 0.3532 },
      { name: 'vpip45-pfr17', vpip: 0.4489, pfr: 0.0884, af: 1.4989, wtsd: 0.3954 },
      { name: 'vpip36-pfr25', vpip: 0.2967, pfr: 0.1926, af: 1.9574, wtsd: 0.5323 },
      { name: 'vpip25-pfr14', vpip: 0.1973, pfr: 0.0852, af: 1.6513, wtsd: 0.5012 },
      { name: 'vpip37-pfr9', vpip: 0.3607, pfr: 0.039, af: 1.4234, wtsd: 0.3951 },
      { name: 'vpip74-pfr21', vpip: 0.8308, pfr: 0.118, af: 1.4504, wtsd: 0.3217 },
      { name: 'vpip43-pfr25', vpip: 0.3813, pfr: 0.1786, af: 1.7622, wtsd: 0.4717 },
      { name: 'vpip67-pfr37', vpip: 0.6808, pfr: 0.2835, af: 1.6648, wtsd: 0.4244 },
      { name: 'vpip54-pfr11', vpip: 0.5828, pfr: 0.0451, af: 1.3802, wtsd: 0.3403 },
      { name: 'vpip43-pfr13', vpip: 0.44, pfr: 0.0598, af: 1.4678, wtsd: 0.3822 },
      { name: 'vpip28-pfr20', vpip: 0.2146, pfr: 0.1504, af: 1.991, wtsd: 0.5615 },
      { name: 'vpip40-pfr16', vpip: 0.3908, pfr: 0.0828, af: 1.499, wtsd: 0.4138 },
      { name: 'vpip22-pfr16', vpip: 0.1595, pfr: 0.1157, af: 1.9207, wtsd: 0.5718 },
      { name: 'vpip37-pfr18', vpip: 0.3379, pfr: 0.1135, af: 1.6167, wtsd: 0.4528 },
      { name: 'vpip49-pfr14', vpip: 0.5148, pfr: 0.0621, af: 1.4316, wtsd: 0.3653 },
      { name: 'vpip45-pfr32', vpip: 0.381, pfr: 0.2492, af: 1.9574, wtsd: 0.5224 },
      { name: 'vpip50-pfr30', vpip: 0.4602, pfr: 0.2242, af: 1.7781, wtsd: 0.4648 },
      { name: 'vpip38-pfr23', vpip: 0.334, pfr: 0.1596, af: 1.7624, wtsd: 0.483 },
    ],
  },
  '3-0': {
    '2-3p': [],
    '4-6p': [
      { name: 'gto', vpip: 0.3628, pfr: 0.1828, af: 1.8552, wtsd: 0.4859 },
      { name: 'vpip80-pfr16', vpip: 0.7978, pfr: 0.1838, af: 1.7446, wtsd: 0.3699 },
      { name: 'vpip20-pfr10', vpip: 0.1336, pfr: 0.0547, af: 1.8929, wtsd: 0.5666 },
      { name: 'vpip69-pfr53', vpip: 0.6847, pfr: 0.6236, af: 2.1618, wtsd: 0.549 },
      { name: 'vpip47-pfr28', vpip: 0.416, pfr: 0.2781, af: 1.9534, wtsd: 0.4868 },
      { name: 'vpip60-pfr12', vpip: 0.5253, pfr: 0.0946, af: 1.714, wtsd: 0.4212 },
      { name: 'vpip79-pfr36', vpip: 0.7765, pfr: 0.4816, af: 1.9078, wtsd: 0.4498 },
      { name: 'vpip41-pfr10', vpip: 0.3351, pfr: 0.0648, af: 1.721, wtsd: 0.4728 },
      { name: 'vpip60-pfr39', vpip: 0.5891, pfr: 0.4686, af: 2.0311, wtsd: 0.4848 },
      { name: 'vpip33-pfr23', vpip: 0.2643, pfr: 0.1953, af: 1.9848, wtsd: 0.5438 },
      { name: 'vpip64-pfr25', vpip: 0.5898, pfr: 0.2846, af: 1.8595, wtsd: 0.4306 },
      { name: 'vpip31-pfr11', vpip: 0.2382, pfr: 0.0695, af: 1.7992, wtsd: 0.512 },
      { name: 'vpip50-pfr19', vpip: 0.4199, pfr: 0.1627, af: 1.8019, wtsd: 0.461 },
      { name: 'vpip70-pfr39', vpip: 0.6983, pfr: 0.5198, af: 1.9803, wtsd: 0.4753 },
      { name: 'vpip68-pfr7', vpip: 0.6263, pfr: 0.0412, af: 1.6535, wtsd: 0.3918 },
      { name: 'vpip25-pfr18', vpip: 0.1876, pfr: 0.1409, af: 2.0653, wtsd: 0.5745 },
      { name: 'vpip72-pfr30', vpip: 0.7107, pfr: 0.4103, af: 1.8809, wtsd: 0.432 },
      { name: 'vpip52-pfr37', vpip: 0.4903, pfr: 0.4065, af: 2.0947, wtsd: 0.4927 },
      { name: 'vpip41-pfr20', vpip: 0.3412, pfr: 0.1698, af: 1.8268, wtsd: 0.4955 },
      { name: 'vpip70-pfr20', vpip: 0.6652, pfr: 0.2332, af: 1.7722, wtsd: 0.3967 },
      { name: 'vpip35-pfr30', vpip: 0.3027, pfr: 0.2838, af: 2.2537, wtsd: 0.5446 },
      { name: 'vpip78-pfr23', vpip: 0.7748, pfr: 0.3148, af: 1.8268, wtsd: 0.3933 },
      { name: 'vpip58-pfr29', vpip: 0.5308, pfr: 0.3255, af: 1.937, wtsd: 0.4603 },
      { name: 'vpip61-pfr46', vpip: 0.6275, pfr: 0.5608, af: 2.1399, wtsd: 0.5129 },
      { name: 'vpip48-pfr11', vpip: 0.4005, pfr: 0.0737, af: 1.7108, wtsd: 0.4555 },
      { name: 'vpip37-pfr15', vpip: 0.2931, pfr: 0.1113, af: 1.7582, wtsd: 0.5007 },
      { name: 'vpip63-pfr17', vpip: 0.5732, pfr: 0.173, af: 1.7725, wtsd: 0.416 },
      { name: 'vpip69-pfr13', vpip: 0.6439, pfr: 0.1227, af: 1.7223, wtsd: 0.3949 },
      { name: 'vpip58-pfr22', vpip: 0.5152, pfr: 0.2246, af: 1.8284, wtsd: 0.4411 },
      { name: 'vpip64-pfr34', vpip: 0.6155, pfr: 0.4202, af: 1.9339, wtsd: 0.4613 },
      { name: 'vpip75-pfr43', vpip: 0.7288, pfr: 0.5555, af: 1.9857, wtsd: 0.4946 },
      { name: 'vpip54-pfr15', vpip: 0.4659, pfr: 0.1281, af: 1.7603, wtsd: 0.4403 },
      { name: 'vpip42-pfr29', vpip: 0.3611, pfr: 0.2753, af: 2.0804, wtsd: 0.5086 },
      { name: 'vpip69-pfr47', vpip: 0.694, pfr: 0.5918, af: 2.08, wtsd: 0.519 },
      { name: 'vpip53-pfr26', vpip: 0.4774, pfr: 0.2709, af: 1.8999, wtsd: 0.4624 },
      { name: 'vpip31-pfr16', vpip: 0.2476, pfr: 0.1254, af: 1.8272, wtsd: 0.524 },
      { name: 'vpip25-pfr8', vpip: 0.1828, pfr: 0.0411, af: 1.7453, wtsd: 0.5244 },
      { name: 'vpip47-pfr34', vpip: 0.4327, pfr: 0.3446, af: 2.0601, wtsd: 0.4981 },
      { name: 'vpip47-pfr23', vpip: 0.3978, pfr: 0.2089, af: 1.8879, wtsd: 0.4781 },
      { name: 'vpip64-pfr42', vpip: 0.6419, pfr: 0.5298, af: 2.05, wtsd: 0.4962 },
      { name: 'vpip75-pfr14', vpip: 0.7284, pfr: 0.152, af: 1.7306, wtsd: 0.3806 },
      { name: 'vpip57-pfr43', vpip: 0.5762, pfr: 0.5007, af: 2.1106, wtsd: 0.5039 },
      { name: 'vpip55-pfr35', vpip: 0.5216, pfr: 0.3884, af: 1.9909, wtsd: 0.481 },
      { name: 'vpip69-pfr28', vpip: 0.659, pfr: 0.3539, af: 1.8839, wtsd: 0.4268 },
      { name: 'vpip45-pfr17', vpip: 0.3708, pfr: 0.1398, af: 1.7866, wtsd: 0.4753 },
      { name: 'vpip36-pfr25', vpip: 0.3029, pfr: 0.2245, af: 1.9951, wtsd: 0.5256 },
      { name: 'vpip25-pfr14', vpip: 0.1834, pfr: 0.0948, af: 1.8558, wtsd: 0.5502 },
      { name: 'vpip37-pfr9', vpip: 0.2992, pfr: 0.0598, af: 1.7192, wtsd: 0.4839 },
      { name: 'vpip74-pfr21', vpip: 0.7227, pfr: 0.2708, af: 1.8027, wtsd: 0.3981 },
      { name: 'vpip43-pfr25', vpip: 0.3628, pfr: 0.2314, af: 1.9335, wtsd: 0.4968 },
      { name: 'vpip67-pfr37', vpip: 0.6567, pfr: 0.472, af: 2.007, wtsd: 0.4628 },
      { name: 'vpip54-pfr11', vpip: 0.4563, pfr: 0.0828, af: 1.7037, wtsd: 0.4397 },
      { name: 'vpip43-pfr13', vpip: 0.3543, pfr: 0.0984, af: 1.7364, wtsd: 0.4683 },
      { name: 'vpip28-pfr20', vpip: 0.2207, pfr: 0.1643, af: 2.0353, wtsd: 0.5545 },
      { name: 'vpip40-pfr16', vpip: 0.33, pfr: 0.1231, af: 1.7809, wtsd: 0.4879 },
      { name: 'vpip22-pfr16', vpip: 0.1549, pfr: 0.1174, af: 2.1074, wtsd: 0.594 },
      { name: 'vpip37-pfr18', vpip: 0.3045, pfr: 0.1502, af: 1.8462, wtsd: 0.502 },
      { name: 'vpip49-pfr14', vpip: 0.4095, pfr: 0.1107, af: 1.7406, wtsd: 0.4585 },
      { name: 'vpip45-pfr32', vpip: 0.3999, pfr: 0.3108, af: 2.0374, wtsd: 0.5008 },
      { name: 'vpip50-pfr30', vpip: 0.4496, pfr: 0.3118, af: 1.9644, wtsd: 0.4832 },
      { name: 'vpip38-pfr23', vpip: 0.3188, pfr: 0.198, af: 1.905, wtsd: 0.5113 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2422, pfr: 0.1219, af: 1.8471, wtsd: 0.4926 },
      { name: 'vpip80-pfr16', vpip: 0.7286, pfr: 0.1417, af: 1.7133, wtsd: 0.3576 },
      { name: 'vpip20-pfr10', vpip: 0.0864, pfr: 0.0372, af: 1.8336, wtsd: 0.5623 },
      { name: 'vpip69-pfr53', vpip: 0.5079, pfr: 0.4691, af: 2.165, wtsd: 0.6577 },
      { name: 'vpip47-pfr28', vpip: 0.2885, pfr: 0.1966, af: 1.9654, wtsd: 0.5061 },
      { name: 'vpip60-pfr12', vpip: 0.3983, pfr: 0.0558, af: 1.6933, wtsd: 0.4071 },
      { name: 'vpip79-pfr36', vpip: 0.648, pfr: 0.3994, af: 1.9373, wtsd: 0.5078 },
      { name: 'vpip41-pfr10', vpip: 0.2217, pfr: 0.0368, af: 1.6945, wtsd: 0.4666 },
      { name: 'vpip60-pfr39', vpip: 0.442, pfr: 0.3594, af: 2.0832, wtsd: 0.5293 },
      { name: 'vpip33-pfr23', vpip: 0.1667, pfr: 0.1262, af: 1.977, wtsd: 0.5642 },
      { name: 'vpip64-pfr25', vpip: 0.4611, pfr: 0.213, af: 1.8613, wtsd: 0.4324 },
      { name: 'vpip31-pfr11', vpip: 0.1508, pfr: 0.0433, af: 1.6953, wtsd: 0.5167 },
      { name: 'vpip50-pfr19', vpip: 0.2953, pfr: 0.1065, af: 1.7906, wtsd: 0.4613 },
      { name: 'vpip70-pfr39', vpip: 0.5449, pfr: 0.4133, af: 2.0363, wtsd: 0.5578 },
      { name: 'vpip68-pfr7', vpip: 0.5083, pfr: 0.0234, af: 1.6167, wtsd: 0.3704 },
      { name: 'vpip25-pfr18', vpip: 0.1176, pfr: 0.0903, af: 2.0243, wtsd: 0.5921 },
      { name: 'vpip72-pfr30', vpip: 0.5853, pfr: 0.3327, af: 1.88, wtsd: 0.4616 },
      { name: 'vpip52-pfr37', vpip: 0.3509, pfr: 0.2968, af: 2.1508, wtsd: 0.529 },
      { name: 'vpip41-pfr20', vpip: 0.2255, pfr: 0.112, af: 1.8222, wtsd: 0.5035 },
      { name: 'vpip70-pfr20', vpip: 0.5541, pfr: 0.1719, af: 1.7895, wtsd: 0.3899 },
      { name: 'vpip35-pfr30', vpip: 0.1968, pfr: 0.185, af: 2.2675, wtsd: 0.5756 },
      { name: 'vpip78-pfr23', vpip: 0.6861, pfr: 0.2547, af: 1.7897, wtsd: 0.3994 },
      { name: 'vpip58-pfr29', vpip: 0.394, pfr: 0.2445, af: 1.9367, wtsd: 0.4693 },
      { name: 'vpip61-pfr46', vpip: 0.4659, pfr: 0.4234, af: 2.1598, wtsd: 0.5934 },
      { name: 'vpip48-pfr11', vpip: 0.2788, pfr: 0.0423, af: 1.6899, wtsd: 0.4444 },
      { name: 'vpip37-pfr15', vpip: 0.1885, pfr: 0.0698, af: 1.7431, wtsd: 0.5005 },
      { name: 'vpip63-pfr17', vpip: 0.4493, pfr: 0.1165, af: 1.7517, wtsd: 0.4069 },
      { name: 'vpip69-pfr13', vpip: 0.5357, pfr: 0.0814, af: 1.6958, wtsd: 0.3779 },
      { name: 'vpip58-pfr22', vpip: 0.386, pfr: 0.1564, af: 1.8301, wtsd: 0.4399 },
      { name: 'vpip64-pfr34', vpip: 0.474, pfr: 0.3285, af: 1.9906, wtsd: 0.4898 },
      { name: 'vpip75-pfr43', vpip: 0.5689, pfr: 0.4428, af: 2.0392, wtsd: 0.5994 },
      { name: 'vpip54-pfr15', vpip: 0.3387, pfr: 0.0789, af: 1.7334, wtsd: 0.4345 },
      { name: 'vpip42-pfr29', vpip: 0.2401, pfr: 0.1868, af: 2.1137, wtsd: 0.5324 },
      { name: 'vpip69-pfr47', vpip: 0.5225, pfr: 0.456, af: 2.1143, wtsd: 0.6319 },
      { name: 'vpip53-pfr26', vpip: 0.3441, pfr: 0.1937, af: 1.9156, wtsd: 0.4697 },
      { name: 'vpip31-pfr16', vpip: 0.1536, pfr: 0.0792, af: 1.7948, wtsd: 0.5333 },
      { name: 'vpip25-pfr8', vpip: 0.1175, pfr: 0.0255, af: 1.702, wtsd: 0.5176 },
      { name: 'vpip47-pfr34', vpip: 0.3019, pfr: 0.2448, af: 2.087, wtsd: 0.5273 },
      { name: 'vpip47-pfr23', vpip: 0.2757, pfr: 0.1432, af: 1.8918, wtsd: 0.4827 },
      { name: 'vpip64-pfr42', vpip: 0.4831, pfr: 0.4083, af: 2.0996, wtsd: 0.5689 },
      { name: 'vpip75-pfr14', vpip: 0.6403, pfr: 0.1086, af: 1.7022, wtsd: 0.3653 },
      { name: 'vpip57-pfr43', vpip: 0.4248, pfr: 0.3774, af: 2.1578, wtsd: 0.5563 },
      { name: 'vpip55-pfr35', vpip: 0.3813, pfr: 0.2904, af: 2.0553, wtsd: 0.5065 },
      { name: 'vpip69-pfr28', vpip: 0.5316, pfr: 0.2785, af: 1.8866, wtsd: 0.4398 },
      { name: 'vpip45-pfr17', vpip: 0.25, pfr: 0.0891, af: 1.767, wtsd: 0.4791 },
      { name: 'vpip36-pfr25', vpip: 0.1965, pfr: 0.1486, af: 2.0066, wtsd: 0.5509 },
      { name: 'vpip25-pfr14', vpip: 0.1148, pfr: 0.0614, af: 1.8344, wtsd: 0.5628 },
      { name: 'vpip37-pfr9', vpip: 0.193, pfr: 0.0345, af: 1.6908, wtsd: 0.4808 },
      { name: 'vpip74-pfr21', vpip: 0.6242, pfr: 0.2108, af: 1.7805, wtsd: 0.3926 },
      { name: 'vpip43-pfr25', vpip: 0.2428, pfr: 0.1576, af: 1.9344, wtsd: 0.5135 },
      { name: 'vpip67-pfr37', vpip: 0.5103, pfr: 0.3747, af: 2.0005, wtsd: 0.5228 },
      { name: 'vpip54-pfr11', vpip: 0.3298, pfr: 0.0473, af: 1.6804, wtsd: 0.4285 },
      { name: 'vpip43-pfr13', vpip: 0.2361, pfr: 0.058, af: 1.7152, wtsd: 0.4678 },
      { name: 'vpip28-pfr20', vpip: 0.1374, pfr: 0.1048, af: 2.0196, wtsd: 0.5769 },
      { name: 'vpip40-pfr16', vpip: 0.2162, pfr: 0.0779, af: 1.7587, wtsd: 0.4932 },
      { name: 'vpip22-pfr16', vpip: 0.0997, pfr: 0.0768, af: 2.0688, wtsd: 0.6024 },
      { name: 'vpip37-pfr18', vpip: 0.195, pfr: 0.0969, af: 1.8119, wtsd: 0.5167 },
      { name: 'vpip49-pfr14', vpip: 0.2853, pfr: 0.0666, af: 1.7226, wtsd: 0.452 },
      { name: 'vpip45-pfr32', vpip: 0.2743, pfr: 0.2177, af: 2.0831, wtsd: 0.5282 },
      { name: 'vpip50-pfr30', vpip: 0.3174, pfr: 0.2235, af: 1.9899, wtsd: 0.5041 },
      { name: 'vpip38-pfr23', vpip: 0.2072, pfr: 0.132, af: 1.9126, wtsd: 0.5295 },
    ],
  },
  '3-50': {
    '2-3p': [],
    '4-6p': [
      { name: 'gto', vpip: 0.411, pfr: 0.2023, af: 1.8284, wtsd: 0.4819 },
      { name: 'vpip80-pfr16', vpip: 0.832, pfr: 0.156, af: 1.6979, wtsd: 0.3646 },
      { name: 'vpip20-pfr10', vpip: 0.1729, pfr: 0.072, af: 1.7786, wtsd: 0.5516 },
      { name: 'vpip69-pfr53', vpip: 0.686, pfr: 0.6111, af: 2.0929, wtsd: 0.5783 },
      { name: 'vpip47-pfr28', vpip: 0.4547, pfr: 0.2962, af: 1.9341, wtsd: 0.4931 },
      { name: 'vpip60-pfr12', vpip: 0.5962, pfr: 0.0969, af: 1.6589, wtsd: 0.4064 },
      { name: 'vpip79-pfr36', vpip: 0.7982, pfr: 0.4323, af: 1.8229, wtsd: 0.4428 },
      { name: 'vpip41-pfr10', vpip: 0.3996, pfr: 0.074, af: 1.6918, wtsd: 0.4524 },
      { name: 'vpip60-pfr39', vpip: 0.6023, pfr: 0.4539, af: 1.9943, wtsd: 0.4965 },
      { name: 'vpip33-pfr23', vpip: 0.3096, pfr: 0.232, af: 2.0531, wtsd: 0.544 },
      { name: 'vpip64-pfr25', vpip: 0.6301, pfr: 0.2702, af: 1.793, wtsd: 0.4292 },
      { name: 'vpip31-pfr11', vpip: 0.2902, pfr: 0.0832, af: 1.7619, wtsd: 0.4852 },
      { name: 'vpip50-pfr19', vpip: 0.4747, pfr: 0.1745, af: 1.7816, wtsd: 0.4504 },
      { name: 'vpip70-pfr39', vpip: 0.7106, pfr: 0.4833, af: 1.913, wtsd: 0.4787 },
      { name: 'vpip68-pfr7', vpip: 0.7001, pfr: 0.0432, af: 1.6012, wtsd: 0.3716 },
      { name: 'vpip25-pfr18', vpip: 0.2293, pfr: 0.176, af: 2.0599, wtsd: 0.58 },
      { name: 'vpip72-pfr30', vpip: 0.7359, pfr: 0.3679, af: 1.8068, wtsd: 0.4305 },
      { name: 'vpip52-pfr37', vpip: 0.5104, pfr: 0.4132, af: 2.0642, wtsd: 0.5105 },
      { name: 'vpip41-pfr20', vpip: 0.391, pfr: 0.1918, af: 1.8168, wtsd: 0.4893 },
      { name: 'vpip70-pfr20', vpip: 0.709, pfr: 0.2068, af: 1.736, wtsd: 0.3957 },
      { name: 'vpip35-pfr30', vpip: 0.3405, pfr: 0.319, af: 2.2106, wtsd: 0.5683 },
      { name: 'vpip78-pfr23', vpip: 0.8051, pfr: 0.2676, af: 1.7342, wtsd: 0.3931 },
      { name: 'vpip58-pfr29', vpip: 0.5632, pfr: 0.3227, af: 1.8787, wtsd: 0.4604 },
      { name: 'vpip61-pfr46', vpip: 0.6284, pfr: 0.5446, af: 2.101, wtsd: 0.54 },
      { name: 'vpip48-pfr11', vpip: 0.4713, pfr: 0.0812, af: 1.6872, wtsd: 0.4319 },
      { name: 'vpip37-pfr15', vpip: 0.3487, pfr: 0.129, af: 1.7709, wtsd: 0.486 },
      { name: 'vpip63-pfr17', vpip: 0.632, pfr: 0.1667, af: 1.71, wtsd: 0.4091 },
      { name: 'vpip69-pfr13', vpip: 0.7056, pfr: 0.1158, af: 1.6705, wtsd: 0.3833 },
      { name: 'vpip58-pfr22', vpip: 0.5646, pfr: 0.2225, af: 1.768, wtsd: 0.4357 },
      { name: 'vpip64-pfr34', vpip: 0.6363, pfr: 0.3989, af: 1.8832, wtsd: 0.4621 },
      { name: 'vpip75-pfr43', vpip: 0.7446, pfr: 0.5214, af: 1.9181, wtsd: 0.5007 },
      { name: 'vpip54-pfr15', vpip: 0.5287, pfr: 0.1337, af: 1.713, wtsd: 0.4278 },
      { name: 'vpip42-pfr29', vpip: 0.3987, pfr: 0.3028, af: 2.103, wtsd: 0.5127 },
      { name: 'vpip69-pfr47', vpip: 0.6982, pfr: 0.5689, af: 2.0225, wtsd: 0.5388 },
      { name: 'vpip53-pfr26', vpip: 0.5155, pfr: 0.2766, af: 1.8441, wtsd: 0.465 },
      { name: 'vpip31-pfr16', vpip: 0.2924, pfr: 0.146, af: 1.8224, wtsd: 0.515 },
      { name: 'vpip25-pfr8', vpip: 0.2336, pfr: 0.0505, af: 1.6954, wtsd: 0.4993 },
      { name: 'vpip47-pfr34', vpip: 0.4616, pfr: 0.3607, af: 2.0464, wtsd: 0.5144 },
      { name: 'vpip47-pfr23', vpip: 0.449, pfr: 0.2259, af: 1.8526, wtsd: 0.469 },
      { name: 'vpip64-pfr42', vpip: 0.6488, pfr: 0.5089, af: 2.0021, wtsd: 0.5113 },
      { name: 'vpip75-pfr14', vpip: 0.7764, pfr: 0.1353, af: 1.6569, wtsd: 0.3758 },
      { name: 'vpip57-pfr43', vpip: 0.5828, pfr: 0.4938, af: 2.0615, wtsd: 0.5284 },
      { name: 'vpip55-pfr35', vpip: 0.5444, pfr: 0.3887, af: 1.9802, wtsd: 0.4903 },
      { name: 'vpip69-pfr28', vpip: 0.6898, pfr: 0.3226, af: 1.8118, wtsd: 0.4232 },
      { name: 'vpip45-pfr17', vpip: 0.4263, pfr: 0.1554, af: 1.7583, wtsd: 0.4645 },
      { name: 'vpip36-pfr25', vpip: 0.3453, pfr: 0.2564, af: 1.9935, wtsd: 0.5365 },
      { name: 'vpip25-pfr14', vpip: 0.2277, pfr: 0.1194, af: 1.8225, wtsd: 0.5466 },
      { name: 'vpip37-pfr9', vpip: 0.3595, pfr: 0.0689, af: 1.6874, wtsd: 0.4618 },
      { name: 'vpip74-pfr21', vpip: 0.7604, pfr: 0.2351, af: 1.7285, wtsd: 0.395 },
      { name: 'vpip43-pfr25', vpip: 0.4064, pfr: 0.2546, af: 1.916, wtsd: 0.5014 },
      { name: 'vpip67-pfr37', vpip: 0.6739, pfr: 0.4448, af: 1.9207, wtsd: 0.47 },
      { name: 'vpip54-pfr11', vpip: 0.5273, pfr: 0.0878, af: 1.675, wtsd: 0.4182 },
      { name: 'vpip43-pfr13', vpip: 0.4183, pfr: 0.11, af: 1.7109, wtsd: 0.4566 },
      { name: 'vpip28-pfr20', vpip: 0.2618, pfr: 0.1985, af: 2.0043, wtsd: 0.568 },
      { name: 'vpip40-pfr16', vpip: 0.3843, pfr: 0.1407, af: 1.7513, wtsd: 0.4761 },
      { name: 'vpip22-pfr16', vpip: 0.194, pfr: 0.1502, af: 2.0532, wtsd: 0.598 },
      { name: 'vpip37-pfr18', vpip: 0.3552, pfr: 0.174, af: 1.8166, wtsd: 0.499 },
      { name: 'vpip49-pfr14', vpip: 0.4711, pfr: 0.1191, af: 1.7024, wtsd: 0.4412 },
      { name: 'vpip45-pfr32', vpip: 0.4337, pfr: 0.3337, af: 2.0262, wtsd: 0.5182 },
      { name: 'vpip50-pfr30', vpip: 0.4825, pfr: 0.3233, af: 1.9218, wtsd: 0.4917 },
      { name: 'vpip38-pfr23', vpip: 0.3646, pfr: 0.2258, af: 1.8898, wtsd: 0.5124 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2953, pfr: 0.1411, af: 1.7987, wtsd: 0.4981 },
      { name: 'vpip80-pfr16', vpip: 0.7768, pfr: 0.1148, af: 1.5968, wtsd: 0.3548 },
      { name: 'vpip20-pfr10', vpip: 0.1183, pfr: 0.052, af: 1.745, wtsd: 0.5487 },
      { name: 'vpip69-pfr53', vpip: 0.5142, pfr: 0.4604, af: 2.1433, wtsd: 0.6894 },
      { name: 'vpip47-pfr28', vpip: 0.3302, pfr: 0.2133, af: 1.9234, wtsd: 0.5237 },
      { name: 'vpip60-pfr12', vpip: 0.4914, pfr: 0.0606, af: 1.5625, wtsd: 0.3888 },
      { name: 'vpip79-pfr36', vpip: 0.6896, pfr: 0.3529, af: 1.807, wtsd: 0.483 },
      { name: 'vpip41-pfr10', vpip: 0.2875, pfr: 0.0461, af: 1.6039, wtsd: 0.4505 },
      { name: 'vpip60-pfr39', vpip: 0.4596, pfr: 0.3445, af: 2.0026, wtsd: 0.5574 },
      { name: 'vpip33-pfr23', vpip: 0.2061, pfr: 0.1577, af: 2.0311, wtsd: 0.5864 },
      { name: 'vpip64-pfr25', vpip: 0.5195, pfr: 0.1962, af: 1.7278, wtsd: 0.4298 },
      { name: 'vpip31-pfr11', vpip: 0.1982, pfr: 0.0552, af: 1.6269, wtsd: 0.4964 },
      { name: 'vpip50-pfr19', vpip: 0.3596, pfr: 0.1185, af: 1.695, wtsd: 0.4567 },
      { name: 'vpip70-pfr39', vpip: 0.5698, pfr: 0.3826, af: 1.9058, wtsd: 0.5522 },
      { name: 'vpip68-pfr7', vpip: 0.6097, pfr: 0.0273, af: 1.492, wtsd: 0.3492 },
      { name: 'vpip25-pfr18', vpip: 0.1532, pfr: 0.1204, af: 2.0286, wtsd: 0.6085 },
      { name: 'vpip72-pfr30', vpip: 0.6254, pfr: 0.2892, af: 1.7585, wtsd: 0.4475 },
      { name: 'vpip52-pfr37', vpip: 0.3751, pfr: 0.303, af: 2.0924, wtsd: 0.5631 },
      { name: 'vpip41-pfr20', vpip: 0.2763, pfr: 0.1334, af: 1.793, wtsd: 0.5066 },
      { name: 'vpip70-pfr20', vpip: 0.6218, pfr: 0.1493, af: 1.6378, wtsd: 0.3853 },
      { name: 'vpip35-pfr30', vpip: 0.2318, pfr: 0.217, af: 2.3035, wtsd: 0.6118 },
      { name: 'vpip78-pfr23', vpip: 0.7305, pfr: 0.2068, af: 1.6631, wtsd: 0.3864 },
      { name: 'vpip58-pfr29', vpip: 0.4406, pfr: 0.2409, af: 1.8811, wtsd: 0.4783 },
      { name: 'vpip61-pfr46', vpip: 0.4708, pfr: 0.409, af: 2.144, wtsd: 0.6264 },
      { name: 'vpip48-pfr11', vpip: 0.355, pfr: 0.0504, af: 1.5918, wtsd: 0.4277 },
      { name: 'vpip37-pfr15', vpip: 0.2396, pfr: 0.088, af: 1.726, wtsd: 0.4992 },
      { name: 'vpip63-pfr17', vpip: 0.5321, pfr: 0.1126, af: 1.6114, wtsd: 0.3957 },
      { name: 'vpip69-pfr13', vpip: 0.6222, pfr: 0.0768, af: 1.5641, wtsd: 0.366 },
      { name: 'vpip58-pfr22', vpip: 0.4511, pfr: 0.1559, af: 1.7187, wtsd: 0.4337 },
      { name: 'vpip64-pfr34', vpip: 0.5054, pfr: 0.3055, af: 1.8873, wtsd: 0.4976 },
      { name: 'vpip75-pfr43', vpip: 0.5966, pfr: 0.4166, af: 1.9544, wtsd: 0.5886 },
      { name: 'vpip54-pfr15', vpip: 0.4193, pfr: 0.0868, af: 1.6085, wtsd: 0.4215 },
      { name: 'vpip42-pfr29', vpip: 0.2783, pfr: 0.2111, af: 2.052, wtsd: 0.5573 },
      { name: 'vpip69-pfr47', vpip: 0.5364, pfr: 0.4396, af: 2.0677, wtsd: 0.6516 },
      { name: 'vpip53-pfr26', vpip: 0.3919, pfr: 0.1986, af: 1.8206, wtsd: 0.4798 },
      { name: 'vpip31-pfr16', vpip: 0.1968, pfr: 0.1029, af: 1.7622, wtsd: 0.5402 },
      { name: 'vpip25-pfr8', vpip: 0.1601, pfr: 0.0336, af: 1.6625, wtsd: 0.4918 },
      { name: 'vpip47-pfr34', vpip: 0.3321, pfr: 0.2599, af: 2.0711, wtsd: 0.5589 },
      { name: 'vpip47-pfr23', vpip: 0.3291, pfr: 0.1602, af: 1.8179, wtsd: 0.4889 },
      { name: 'vpip64-pfr42', vpip: 0.4977, pfr: 0.3893, af: 2.0298, wtsd: 0.5878 },
      { name: 'vpip75-pfr14', vpip: 0.7087, pfr: 0.0935, af: 1.5679, wtsd: 0.3568 },
      { name: 'vpip57-pfr43', vpip: 0.4347, pfr: 0.368, af: 2.1172, wtsd: 0.5931 },
      { name: 'vpip55-pfr35', vpip: 0.409, pfr: 0.2882, af: 1.9794, wtsd: 0.5302 },
      { name: 'vpip69-pfr28', vpip: 0.5813, pfr: 0.2455, af: 1.7529, wtsd: 0.4355 },
      { name: 'vpip45-pfr17', vpip: 0.311, pfr: 0.1043, af: 1.6978, wtsd: 0.4722 },
      { name: 'vpip36-pfr25', vpip: 0.2362, pfr: 0.1779, af: 2.0331, wtsd: 0.5709 },
      { name: 'vpip25-pfr14', vpip: 0.1529, pfr: 0.0849, af: 1.8059, wtsd: 0.5605 },
      { name: 'vpip37-pfr9', vpip: 0.2521, pfr: 0.0434, af: 1.6197, wtsd: 0.4621 },
      { name: 'vpip74-pfr21', vpip: 0.6803, pfr: 0.1758, af: 1.649, wtsd: 0.3834 },
      { name: 'vpip43-pfr25', vpip: 0.2867, pfr: 0.1803, af: 1.9098, wtsd: 0.5314 },
      { name: 'vpip67-pfr37', vpip: 0.535, pfr: 0.3482, af: 1.9602, wtsd: 0.5161 },
      { name: 'vpip54-pfr11', vpip: 0.4162, pfr: 0.0547, af: 1.5754, wtsd: 0.4093 },
      { name: 'vpip43-pfr13', vpip: 0.306, pfr: 0.0702, af: 1.6214, wtsd: 0.4505 },
      { name: 'vpip28-pfr20', vpip: 0.1744, pfr: 0.1354, af: 2.0226, wtsd: 0.5963 },
      { name: 'vpip40-pfr16', vpip: 0.2725, pfr: 0.0957, af: 1.706, wtsd: 0.4861 },
      { name: 'vpip22-pfr16', vpip: 0.1324, pfr: 0.1047, af: 2.0166, wtsd: 0.6183 },
      { name: 'vpip37-pfr18', vpip: 0.2439, pfr: 0.1208, af: 1.7836, wtsd: 0.5209 },
      { name: 'vpip49-pfr14', vpip: 0.3583, pfr: 0.0772, af: 1.6331, wtsd: 0.4403 },
      { name: 'vpip45-pfr32', vpip: 0.3088, pfr: 0.2379, af: 2.049, wtsd: 0.5584 },
      { name: 'vpip50-pfr30', vpip: 0.3537, pfr: 0.2343, af: 1.9396, wtsd: 0.5258 },
      { name: 'vpip38-pfr23', vpip: 0.2521, pfr: 0.1584, af: 1.8939, wtsd: 0.5422 },
    ],
  },
}

/**
 * 翻后档位元数据清单（三维：盲注结构 → 人数范围 → 档位数组）
 * 数据来源：017-player-profile-data-cash-5.json
 */
export const POSTFLOP_PROFILE_META_BY_FORMAT: {
  [F in GameFormat]?: { [R in SeatRange]?: ProfileMeta[] }
} = {
  '2-0': {
    '2-3p': [
      { name: 'gto', vpip: 0.6561, pfr: 0.3977, af: 1.8429, wtsd: 0.4686 },
      { name: 'af5.1-wtsd50', vpip: 0.6555, pfr: 0.3978, af: 6.6479, wtsd: 0.297 },
      { name: 'af0.5-wtsd79', vpip: 0.6534, pfr: 0.3971, af: 0.6367, wtsd: 0.7357 },
      { name: 'af2.6-wtsd53', vpip: 0.6542, pfr: 0.397, af: 2.86, wtsd: 0.3819 },
      { name: 'af1.3-wtsd59', vpip: 0.6541, pfr: 0.3965, af: 1.5356, wtsd: 0.4907 },
      { name: 'af3.8-wtsd49', vpip: 0.6552, pfr: 0.3972, af: 4.3859, wtsd: 0.3062 },
      { name: 'af5.8-wtsd46', vpip: 0.6551, pfr: 0.3976, af: 7.3825, wtsd: 0.2496 },
      { name: 'af4.5-wtsd47', vpip: 0.6548, pfr: 0.3975, af: 5.2508, wtsd: 0.2768 },
      { name: 'af0.9-wtsd70', vpip: 0.6542, pfr: 0.3975, af: 1.0932, wtsd: 0.6278 },
      { name: 'af3.2-wtsd49', vpip: 0.6526, pfr: 0.3953, af: 3.5939, wtsd: 0.3284 },
      { name: 'af1.5-wtsd70', vpip: 0.6561, pfr: 0.3979, af: 1.756, wtsd: 0.6468 },
      { name: 'af2.0-wtsd55', vpip: 0.6542, pfr: 0.3972, af: 2.1923, wtsd: 0.427 },
      { name: 'af0.6-wtsd72', vpip: 0.6543, pfr: 0.3966, af: 0.7565, wtsd: 0.6516 },
      { name: 'af1.1-wtsd63', vpip: 0.6512, pfr: 0.3965, af: 1.2648, wtsd: 0.5479 },
      { name: 'af2.9-wtsd53', vpip: 0.6485, pfr: 0.3968, af: 3.2536, wtsd: 0.3693 },
      { name: 'af3.5-wtsd52', vpip: 0.6544, pfr: 0.3972, af: 4.1562, wtsd: 0.3483 },
      { name: 'af4.1-wtsd49', vpip: 0.6554, pfr: 0.3967, af: 4.9616, wtsd: 0.302 },
      { name: 'af5.4-wtsd48', vpip: 0.6549, pfr: 0.3963, af: 6.9014, wtsd: 0.2716 },
      { name: 'af1.5-wtsd64', vpip: 0.6546, pfr: 0.3978, af: 1.728, wtsd: 0.56 },
      { name: 'af3.4-wtsd45', vpip: 0.655, pfr: 0.3974, af: 4.1273, wtsd: 0.283 },
      { name: 'af2.3-wtsd52', vpip: 0.6554, pfr: 0.3968, af: 2.4839, wtsd: 0.3897 },
      { name: 'af4.8-wtsd48', vpip: 0.6561, pfr: 0.3979, af: 6.0279, wtsd: 0.2815 },
      { name: 'af1.6-wtsd59', vpip: 0.6515, pfr: 0.3973, af: 1.8246, wtsd: 0.4785 },
      { name: 'af5.6-wtsd47', vpip: 0.6547, pfr: 0.3986, af: 7.1907, wtsd: 0.2609 },
      { name: 'af4.6-wtsd50', vpip: 0.6543, pfr: 0.3967, af: 5.7709, wtsd: 0.3089 },
      { name: 'af5.0-wtsd46', vpip: 0.6536, pfr: 0.3956, af: 5.7902, wtsd: 0.2552 },
      { name: 'af2.8-wtsd50', vpip: 0.6549, pfr: 0.3977, af: 3.0318, wtsd: 0.3532 },
      { name: 'af2.1-wtsd52', vpip: 0.6552, pfr: 0.3977, af: 2.302, wtsd: 0.3844 },
      { name: 'af3.4-wtsd49', vpip: 0.6551, pfr: 0.3981, af: 3.8117, wtsd: 0.3138 },
      { name: 'af3.9-wtsd51', vpip: 0.6544, pfr: 0.3959, af: 4.8551, wtsd: 0.3257 },
      { name: 'af1.8-wtsd55', vpip: 0.6504, pfr: 0.3968, af: 1.9957, wtsd: 0.4321 },
      { name: 'af5.2-wtsd47', vpip: 0.6528, pfr: 0.396, af: 6.4128, wtsd: 0.2607 },
      { name: 'af0.5-wtsd75', vpip: 0.6545, pfr: 0.3966, af: 0.6904, wtsd: 0.6947 },
      { name: 'af3.0-wtsd48', vpip: 0.6552, pfr: 0.3976, af: 3.2903, wtsd: 0.325 },
      { name: 'af3.6-wtsd49', vpip: 0.6528, pfr: 0.3967, af: 4.1486, wtsd: 0.3138 },
      { name: 'af1.1-wtsd67', vpip: 0.6536, pfr: 0.3977, af: 1.2869, wtsd: 0.5925 },
      { name: 'af4.0-wtsd48', vpip: 0.6541, pfr: 0.397, af: 4.589, wtsd: 0.2927 },
      { name: 'af1.2-wtsd61', vpip: 0.6543, pfr: 0.3976, af: 1.4159, wtsd: 0.5197 },
      { name: 'af4.3-wtsd48', vpip: 0.6558, pfr: 0.3964, af: 5.1228, wtsd: 0.2885 },
      { name: 'af2.5-wtsd55', vpip: 0.6539, pfr: 0.3977, af: 2.792, wtsd: 0.4142 },
      { name: 'af2.5-wtsd50', vpip: 0.6542, pfr: 0.3967, af: 2.705, wtsd: 0.3591 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.3631, pfr: 0.1926, af: 1.8398, wtsd: 0.4502 },
      { name: 'af5.1-wtsd50', vpip: 0.3617, pfr: 0.1917, af: 6.8238, wtsd: 0.2857 },
      { name: 'af0.5-wtsd79', vpip: 0.3617, pfr: 0.1922, af: 0.5696, wtsd: 0.7349 },
      { name: 'af2.6-wtsd53', vpip: 0.3619, pfr: 0.192, af: 2.8799, wtsd: 0.3679 },
      { name: 'af1.3-wtsd59', vpip: 0.3627, pfr: 0.1924, af: 1.5196, wtsd: 0.4747 },
      { name: 'af3.8-wtsd49', vpip: 0.3623, pfr: 0.1923, af: 4.5072, wtsd: 0.2988 },
      { name: 'af5.8-wtsd46', vpip: 0.3639, pfr: 0.1936, af: 7.6845, wtsd: 0.2462 },
      { name: 'af4.5-wtsd47', vpip: 0.3635, pfr: 0.1924, af: 5.429, wtsd: 0.2707 },
      { name: 'af0.9-wtsd70', vpip: 0.3629, pfr: 0.1924, af: 1.0375, wtsd: 0.6173 },
      { name: 'af3.2-wtsd49', vpip: 0.3603, pfr: 0.1935, af: 3.7564, wtsd: 0.3148 },
      { name: 'af1.5-wtsd70', vpip: 0.3626, pfr: 0.1921, af: 1.6703, wtsd: 0.6345 },
      { name: 'af2.0-wtsd55', vpip: 0.3626, pfr: 0.1929, af: 2.2022, wtsd: 0.4095 },
      { name: 'af0.6-wtsd72', vpip: 0.363, pfr: 0.1923, af: 0.693, wtsd: 0.6477 },
      { name: 'af1.1-wtsd63', vpip: 0.3607, pfr: 0.1928, af: 1.2166, wtsd: 0.5301 },
      { name: 'af2.9-wtsd53', vpip: 0.3613, pfr: 0.1938, af: 3.3079, wtsd: 0.3593 },
      { name: 'af3.5-wtsd52', vpip: 0.3624, pfr: 0.1922, af: 4.2028, wtsd: 0.3332 },
      { name: 'af4.1-wtsd49', vpip: 0.3629, pfr: 0.1929, af: 5.0528, wtsd: 0.2917 },
      { name: 'af5.4-wtsd48', vpip: 0.3633, pfr: 0.1928, af: 7.0834, wtsd: 0.2641 },
      { name: 'af1.5-wtsd64', vpip: 0.3617, pfr: 0.1928, af: 1.6658, wtsd: 0.546 },
      { name: 'af3.4-wtsd45', vpip: 0.3629, pfr: 0.1924, af: 4.4338, wtsd: 0.2785 },
      { name: 'af2.3-wtsd52', vpip: 0.3634, pfr: 0.1924, af: 2.507, wtsd: 0.3746 },
      { name: 'af4.8-wtsd48', vpip: 0.3626, pfr: 0.1929, af: 6.1503, wtsd: 0.2733 },
      { name: 'af1.6-wtsd59', vpip: 0.3591, pfr: 0.191, af: 1.7484, wtsd: 0.4682 },
      { name: 'af5.6-wtsd47', vpip: 0.3636, pfr: 0.1924, af: 7.3415, wtsd: 0.255 },
      { name: 'af4.6-wtsd50', vpip: 0.3628, pfr: 0.1926, af: 5.9021, wtsd: 0.2976 },
      { name: 'af5.0-wtsd46', vpip: 0.3626, pfr: 0.1924, af: 6.0357, wtsd: 0.2549 },
      { name: 'af2.8-wtsd50', vpip: 0.363, pfr: 0.1921, af: 3.0865, wtsd: 0.3381 },
      { name: 'af2.1-wtsd52', vpip: 0.3622, pfr: 0.192, af: 2.335, wtsd: 0.3729 },
      { name: 'af3.4-wtsd49', vpip: 0.3624, pfr: 0.1923, af: 3.8697, wtsd: 0.3068 },
      { name: 'af3.9-wtsd51', vpip: 0.3632, pfr: 0.1917, af: 4.8472, wtsd: 0.318 },
      { name: 'af1.8-wtsd55', vpip: 0.361, pfr: 0.1945, af: 1.9723, wtsd: 0.4208 },
      { name: 'af5.2-wtsd47', vpip: 0.3634, pfr: 0.1924, af: 6.6649, wtsd: 0.2551 },
      { name: 'af0.5-wtsd75', vpip: 0.3632, pfr: 0.1929, af: 0.6279, wtsd: 0.6858 },
      { name: 'af3.0-wtsd48', vpip: 0.3622, pfr: 0.1922, af: 3.4126, wtsd: 0.314 },
      { name: 'af3.6-wtsd49', vpip: 0.3627, pfr: 0.1925, af: 4.1922, wtsd: 0.3022 },
      { name: 'af1.1-wtsd67', vpip: 0.3634, pfr: 0.1928, af: 1.2178, wtsd: 0.5793 },
      { name: 'af4.0-wtsd48', vpip: 0.3634, pfr: 0.1927, af: 4.6749, wtsd: 0.2837 },
      { name: 'af1.2-wtsd61', vpip: 0.3628, pfr: 0.1927, af: 1.3942, wtsd: 0.5067 },
      { name: 'af4.3-wtsd48', vpip: 0.3622, pfr: 0.1922, af: 5.2836, wtsd: 0.2807 },
      { name: 'af2.5-wtsd55', vpip: 0.3622, pfr: 0.1924, af: 2.7637, wtsd: 0.4012 },
      { name: 'af2.5-wtsd50', vpip: 0.3629, pfr: 0.1919, af: 2.7387, wtsd: 0.3465 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2436, pfr: 0.1182, af: 1.7953, wtsd: 0.4541 },
      { name: 'af5.1-wtsd50', vpip: 0.2433, pfr: 0.1185, af: 6.6991, wtsd: 0.2961 },
      { name: 'af0.5-wtsd79', vpip: 0.2441, pfr: 0.1194, af: 0.5465, wtsd: 0.7422 },
      { name: 'af2.6-wtsd53', vpip: 0.2439, pfr: 0.1179, af: 2.8429, wtsd: 0.3696 },
      { name: 'af1.3-wtsd59', vpip: 0.244, pfr: 0.1189, af: 1.4983, wtsd: 0.4763 },
      { name: 'af3.8-wtsd49', vpip: 0.2436, pfr: 0.1179, af: 4.4252, wtsd: 0.3042 },
      { name: 'af5.8-wtsd46', vpip: 0.2431, pfr: 0.1174, af: 7.5704, wtsd: 0.2558 },
      { name: 'af4.5-wtsd47', vpip: 0.2439, pfr: 0.1182, af: 5.39, wtsd: 0.2797 },
      { name: 'af0.9-wtsd70', vpip: 0.2436, pfr: 0.1179, af: 0.9962, wtsd: 0.6217 },
      { name: 'af3.2-wtsd49', vpip: 0.2441, pfr: 0.1197, af: 3.5993, wtsd: 0.324 },
      { name: 'af1.5-wtsd70', vpip: 0.2443, pfr: 0.1187, af: 1.6171, wtsd: 0.6366 },
      { name: 'af2.0-wtsd55', vpip: 0.2435, pfr: 0.1179, af: 2.1482, wtsd: 0.4145 },
      { name: 'af0.6-wtsd72', vpip: 0.2439, pfr: 0.1183, af: 0.6811, wtsd: 0.6525 },
      { name: 'af1.1-wtsd63', vpip: 0.242, pfr: 0.1187, af: 1.2147, wtsd: 0.5312 },
      { name: 'af2.9-wtsd53', vpip: 0.244, pfr: 0.119, af: 3.1814, wtsd: 0.3601 },
      { name: 'af3.5-wtsd52', vpip: 0.2435, pfr: 0.1181, af: 4.1009, wtsd: 0.3416 },
      { name: 'af4.1-wtsd49', vpip: 0.2433, pfr: 0.118, af: 4.9846, wtsd: 0.298 },
      { name: 'af5.4-wtsd48', vpip: 0.2446, pfr: 0.1181, af: 7.0403, wtsd: 0.2724 },
      { name: 'af1.5-wtsd64', vpip: 0.2433, pfr: 0.1186, af: 1.6141, wtsd: 0.5495 },
      { name: 'af3.4-wtsd45', vpip: 0.2432, pfr: 0.1179, af: 4.4336, wtsd: 0.2866 },
      { name: 'af2.3-wtsd52', vpip: 0.2432, pfr: 0.1185, af: 2.4736, wtsd: 0.3806 },
      { name: 'af4.8-wtsd48', vpip: 0.2435, pfr: 0.1178, af: 6.1423, wtsd: 0.2817 },
      { name: 'af1.6-wtsd59', vpip: 0.2433, pfr: 0.1182, af: 1.7518, wtsd: 0.4731 },
      { name: 'af5.6-wtsd47', vpip: 0.2436, pfr: 0.1182, af: 7.3891, wtsd: 0.2656 },
      { name: 'af4.6-wtsd50', vpip: 0.2437, pfr: 0.1178, af: 5.8071, wtsd: 0.3047 },
      { name: 'af5.0-wtsd46', vpip: 0.2439, pfr: 0.1175, af: 6.02, wtsd: 0.2608 },
      { name: 'af2.8-wtsd50', vpip: 0.2435, pfr: 0.1175, af: 3.0133, wtsd: 0.3466 },
      { name: 'af2.1-wtsd52', vpip: 0.2435, pfr: 0.1184, af: 2.3411, wtsd: 0.3759 },
      { name: 'af3.4-wtsd49', vpip: 0.2438, pfr: 0.1187, af: 3.8147, wtsd: 0.3134 },
      { name: 'af3.9-wtsd51', vpip: 0.244, pfr: 0.1184, af: 4.8084, wtsd: 0.3235 },
      { name: 'af1.8-wtsd55', vpip: 0.2419, pfr: 0.1187, af: 2.0008, wtsd: 0.4177 },
      { name: 'af5.2-wtsd47', vpip: 0.2438, pfr: 0.1185, af: 6.6414, wtsd: 0.265 },
      { name: 'af0.5-wtsd75', vpip: 0.2439, pfr: 0.1188, af: 0.6031, wtsd: 0.6959 },
      { name: 'af3.0-wtsd48', vpip: 0.2441, pfr: 0.1183, af: 3.391, wtsd: 0.3193 },
      { name: 'af3.6-wtsd49', vpip: 0.2442, pfr: 0.1186, af: 4.1573, wtsd: 0.3121 },
      { name: 'af1.1-wtsd67', vpip: 0.2442, pfr: 0.1187, af: 1.1867, wtsd: 0.5823 },
      { name: 'af4.0-wtsd48', vpip: 0.2445, pfr: 0.1189, af: 4.65, wtsd: 0.2943 },
      { name: 'af1.2-wtsd61', vpip: 0.2432, pfr: 0.1182, af: 1.3688, wtsd: 0.5105 },
      { name: 'af4.3-wtsd48', vpip: 0.2439, pfr: 0.1185, af: 5.1635, wtsd: 0.2904 },
      { name: 'af2.5-wtsd55', vpip: 0.2436, pfr: 0.1182, af: 2.6858, wtsd: 0.4033 },
      { name: 'af2.5-wtsd50', vpip: 0.2433, pfr: 0.1179, af: 2.7454, wtsd: 0.3502 },
    ],
  },
  '2-50': {
    '2-3p': [
      { name: 'gto', vpip: 0.7079, pfr: 0.4201, af: 1.8919, wtsd: 0.4572 },
      { name: 'af5.1-wtsd50', vpip: 0.7099, pfr: 0.4198, af: 6.5652, wtsd: 0.3188 },
      { name: 'af0.5-wtsd79', vpip: 0.7088, pfr: 0.4191, af: 0.6505, wtsd: 0.7212 },
      { name: 'af2.6-wtsd53', vpip: 0.7099, pfr: 0.4189, af: 2.8352, wtsd: 0.395 },
      { name: 'af1.3-wtsd59', vpip: 0.7051, pfr: 0.4158, af: 1.5156, wtsd: 0.49 },
      { name: 'af3.8-wtsd49', vpip: 0.709, pfr: 0.4214, af: 4.3875, wtsd: 0.3092 },
      { name: 'af5.8-wtsd46', vpip: 0.7099, pfr: 0.4189, af: 7.1469, wtsd: 0.2672 },
      { name: 'af4.5-wtsd47', vpip: 0.7065, pfr: 0.4196, af: 5.3031, wtsd: 0.2912 },
      { name: 'af0.9-wtsd70', vpip: 0.7106, pfr: 0.4168, af: 1.1056, wtsd: 0.6278 },
      { name: 'af3.2-wtsd49', vpip: 0.7169, pfr: 0.43, af: 3.6942, wtsd: 0.3188 },
      { name: 'af1.5-wtsd70', vpip: 0.7094, pfr: 0.4222, af: 1.7903, wtsd: 0.6316 },
      { name: 'af2.0-wtsd55', vpip: 0.7068, pfr: 0.4192, af: 2.1836, wtsd: 0.4272 },
      { name: 'af0.6-wtsd72', vpip: 0.709, pfr: 0.4207, af: 0.7731, wtsd: 0.6439 },
      { name: 'af1.1-wtsd63', vpip: 0.7061, pfr: 0.4174, af: 1.3002, wtsd: 0.5285 },
      { name: 'af2.9-wtsd53', vpip: 0.7085, pfr: 0.4168, af: 3.3299, wtsd: 0.3699 },
      { name: 'af3.5-wtsd52', vpip: 0.7093, pfr: 0.4193, af: 4.271, wtsd: 0.3561 },
      { name: 'af4.1-wtsd49', vpip: 0.7107, pfr: 0.4168, af: 4.9024, wtsd: 0.3133 },
      { name: 'af5.4-wtsd48', vpip: 0.7066, pfr: 0.4164, af: 6.6307, wtsd: 0.2908 },
      { name: 'af1.5-wtsd64', vpip: 0.7118, pfr: 0.4217, af: 1.7848, wtsd: 0.5455 },
      { name: 'af3.4-wtsd45', vpip: 0.7087, pfr: 0.4172, af: 3.7478, wtsd: 0.2965 },
      { name: 'af2.3-wtsd52', vpip: 0.7067, pfr: 0.4176, af: 2.5084, wtsd: 0.3939 },
      { name: 'af4.8-wtsd48', vpip: 0.7077, pfr: 0.4184, af: 5.9184, wtsd: 0.2962 },
      { name: 'af1.6-wtsd59', vpip: 0.7144, pfr: 0.431, af: 1.7957, wtsd: 0.4787 },
      { name: 'af5.6-wtsd47', vpip: 0.7073, pfr: 0.4145, af: 6.9484, wtsd: 0.2809 },
      { name: 'af4.6-wtsd50', vpip: 0.7071, pfr: 0.4159, af: 5.7405, wtsd: 0.3218 },
      { name: 'af5.0-wtsd46', vpip: 0.7084, pfr: 0.418, af: 5.6835, wtsd: 0.2708 },
      { name: 'af2.8-wtsd50', vpip: 0.7057, pfr: 0.4158, af: 3.1175, wtsd: 0.3548 },
      { name: 'af2.1-wtsd52', vpip: 0.7078, pfr: 0.4182, af: 2.2448, wtsd: 0.3915 },
      { name: 'af3.4-wtsd49', vpip: 0.7075, pfr: 0.4212, af: 3.8571, wtsd: 0.3247 },
      { name: 'af3.9-wtsd51', vpip: 0.7088, pfr: 0.4191, af: 4.9371, wtsd: 0.347 },
      { name: 'af1.8-wtsd55', vpip: 0.7123, pfr: 0.4234, af: 2.0684, wtsd: 0.4161 },
      { name: 'af5.2-wtsd47', vpip: 0.7076, pfr: 0.4203, af: 6.284, wtsd: 0.2756 },
      { name: 'af0.5-wtsd75', vpip: 0.7113, pfr: 0.4233, af: 0.6859, wtsd: 0.67 },
      { name: 'af3.0-wtsd48', vpip: 0.709, pfr: 0.4168, af: 3.2699, wtsd: 0.3314 },
      { name: 'af3.6-wtsd49', vpip: 0.7122, pfr: 0.4198, af: 4.2037, wtsd: 0.3212 },
      { name: 'af1.1-wtsd67', vpip: 0.7084, pfr: 0.418, af: 1.2941, wtsd: 0.5847 },
      { name: 'af4.0-wtsd48', vpip: 0.7091, pfr: 0.4179, af: 4.5273, wtsd: 0.3067 },
      { name: 'af1.2-wtsd61', vpip: 0.7067, pfr: 0.4167, af: 1.4168, wtsd: 0.5174 },
      { name: 'af4.3-wtsd48', vpip: 0.7107, pfr: 0.4208, af: 5.2208, wtsd: 0.2883 },
      { name: 'af2.5-wtsd55', vpip: 0.7067, pfr: 0.4194, af: 2.8461, wtsd: 0.4161 },
      { name: 'af2.5-wtsd50', vpip: 0.7107, pfr: 0.4195, af: 2.7904, wtsd: 0.3584 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.4369, pfr: 0.212, af: 1.8006, wtsd: 0.439 },
      { name: 'af5.1-wtsd50', vpip: 0.4343, pfr: 0.2107, af: 6.5147, wtsd: 0.299 },
      { name: 'af0.5-wtsd79', vpip: 0.4344, pfr: 0.2103, af: 0.5328, wtsd: 0.7156 },
      { name: 'af2.6-wtsd53', vpip: 0.4351, pfr: 0.2131, af: 2.949, wtsd: 0.3571 },
      { name: 'af1.3-wtsd59', vpip: 0.4304, pfr: 0.2084, af: 1.4258, wtsd: 0.4654 },
      { name: 'af3.8-wtsd49', vpip: 0.4346, pfr: 0.2106, af: 4.5661, wtsd: 0.2985 },
      { name: 'af5.8-wtsd46', vpip: 0.4326, pfr: 0.2075, af: 7.2886, wtsd: 0.2593 },
      { name: 'af4.5-wtsd47', vpip: 0.435, pfr: 0.2098, af: 5.2395, wtsd: 0.2798 },
      { name: 'af0.9-wtsd70', vpip: 0.4343, pfr: 0.2125, af: 1.0048, wtsd: 0.5994 },
      { name: 'af3.2-wtsd49', vpip: 0.4294, pfr: 0.2073, af: 3.9381, wtsd: 0.3004 },
      { name: 'af1.5-wtsd70', vpip: 0.4383, pfr: 0.2132, af: 1.7206, wtsd: 0.5973 },
      { name: 'af2.0-wtsd55', vpip: 0.4356, pfr: 0.211, af: 2.1797, wtsd: 0.3983 },
      { name: 'af0.6-wtsd72', vpip: 0.4345, pfr: 0.2101, af: 0.6523, wtsd: 0.6229 },
      { name: 'af1.1-wtsd63', vpip: 0.4383, pfr: 0.2147, af: 1.2484, wtsd: 0.514 },
      { name: 'af2.9-wtsd53', vpip: 0.4324, pfr: 0.2062, af: 3.3705, wtsd: 0.347 },
      { name: 'af3.5-wtsd52', vpip: 0.4336, pfr: 0.2105, af: 4.2635, wtsd: 0.3279 },
      { name: 'af4.1-wtsd49', vpip: 0.4352, pfr: 0.2102, af: 4.898, wtsd: 0.2946 },
      { name: 'af5.4-wtsd48', vpip: 0.4344, pfr: 0.212, af: 6.9657, wtsd: 0.28 },
      { name: 'af1.5-wtsd64', vpip: 0.4368, pfr: 0.211, af: 1.6672, wtsd: 0.5216 },
      { name: 'af3.4-wtsd45', vpip: 0.4343, pfr: 0.2087, af: 3.7672, wtsd: 0.288 },
      { name: 'af2.3-wtsd52', vpip: 0.4326, pfr: 0.2121, af: 2.5379, wtsd: 0.3664 },
      { name: 'af4.8-wtsd48', vpip: 0.4311, pfr: 0.2077, af: 5.8864, wtsd: 0.2836 },
      { name: 'af1.6-wtsd59', vpip: 0.438, pfr: 0.2114, af: 1.7133, wtsd: 0.4513 },
      { name: 'af5.6-wtsd47', vpip: 0.4316, pfr: 0.2092, af: 7.1184, wtsd: 0.2664 },
      { name: 'af4.6-wtsd50', vpip: 0.4315, pfr: 0.2107, af: 5.5636, wtsd: 0.3076 },
      { name: 'af5.0-wtsd46', vpip: 0.4338, pfr: 0.2092, af: 5.8473, wtsd: 0.266 },
      { name: 'af2.8-wtsd50', vpip: 0.4347, pfr: 0.2123, af: 3.0975, wtsd: 0.3368 },
      { name: 'af2.1-wtsd52', vpip: 0.434, pfr: 0.2132, af: 2.3251, wtsd: 0.3564 },
      { name: 'af3.4-wtsd49', vpip: 0.4331, pfr: 0.21, af: 3.8977, wtsd: 0.3017 },
      { name: 'af3.9-wtsd51', vpip: 0.4326, pfr: 0.209, af: 4.9011, wtsd: 0.3159 },
      { name: 'af1.8-wtsd55', vpip: 0.4378, pfr: 0.2128, af: 1.9398, wtsd: 0.4131 },
      { name: 'af5.2-wtsd47', vpip: 0.4325, pfr: 0.2113, af: 6.4749, wtsd: 0.2656 },
      { name: 'af0.5-wtsd75', vpip: 0.4354, pfr: 0.213, af: 0.5896, wtsd: 0.6684 },
      { name: 'af3.0-wtsd48', vpip: 0.4353, pfr: 0.2112, af: 3.3809, wtsd: 0.3041 },
      { name: 'af3.6-wtsd49', vpip: 0.4339, pfr: 0.207, af: 4.3118, wtsd: 0.3012 },
      { name: 'af1.1-wtsd67', vpip: 0.4349, pfr: 0.2131, af: 1.1999, wtsd: 0.5596 },
      { name: 'af4.0-wtsd48', vpip: 0.4313, pfr: 0.2104, af: 4.7243, wtsd: 0.2899 },
      { name: 'af1.2-wtsd61', vpip: 0.4325, pfr: 0.2091, af: 1.3497, wtsd: 0.494 },
      { name: 'af4.3-wtsd48', vpip: 0.4354, pfr: 0.2115, af: 5.1853, wtsd: 0.2832 },
      { name: 'af2.5-wtsd55', vpip: 0.435, pfr: 0.2136, af: 2.8124, wtsd: 0.3861 },
      { name: 'af2.5-wtsd50', vpip: 0.4362, pfr: 0.2121, af: 2.7041, wtsd: 0.3453 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.3207, pfr: 0.1316, af: 1.7304, wtsd: 0.4485 },
      { name: 'af5.1-wtsd50', vpip: 0.3222, pfr: 0.1328, af: 6.0626, wtsd: 0.3362 },
      { name: 'af0.5-wtsd79', vpip: 0.3212, pfr: 0.1325, af: 0.4744, wtsd: 0.7367 },
      { name: 'af2.6-wtsd53', vpip: 0.3203, pfr: 0.13, af: 2.8436, wtsd: 0.3815 },
      { name: 'af1.3-wtsd59', vpip: 0.3232, pfr: 0.1312, af: 1.4172, wtsd: 0.4822 },
      { name: 'af3.8-wtsd49', vpip: 0.3242, pfr: 0.1323, af: 4.332, wtsd: 0.3319 },
      { name: 'af5.8-wtsd46', vpip: 0.3214, pfr: 0.1308, af: 7.1235, wtsd: 0.2979 },
      { name: 'af4.5-wtsd47', vpip: 0.3218, pfr: 0.1321, af: 5.0177, wtsd: 0.3199 },
      { name: 'af0.9-wtsd70', vpip: 0.3195, pfr: 0.131, af: 0.9183, wtsd: 0.6142 },
      { name: 'af3.2-wtsd49', vpip: 0.3177, pfr: 0.1339, af: 3.3433, wtsd: 0.3423 },
      { name: 'af1.5-wtsd70', vpip: 0.322, pfr: 0.1305, af: 1.621, wtsd: 0.5963 },
      { name: 'af2.0-wtsd55', vpip: 0.3221, pfr: 0.1326, af: 2.1282, wtsd: 0.4207 },
      { name: 'af0.6-wtsd72', vpip: 0.3229, pfr: 0.132, af: 0.5896, wtsd: 0.6464 },
      { name: 'af1.1-wtsd63', vpip: 0.3229, pfr: 0.1351, af: 1.1271, wtsd: 0.536 },
      { name: 'af2.9-wtsd53', vpip: 0.3263, pfr: 0.1322, af: 3.3331, wtsd: 0.3546 },
      { name: 'af3.5-wtsd52', vpip: 0.3229, pfr: 0.131, af: 3.9434, wtsd: 0.3597 },
      { name: 'af4.1-wtsd49', vpip: 0.3198, pfr: 0.1315, af: 4.8658, wtsd: 0.3299 },
      { name: 'af5.4-wtsd48', vpip: 0.3231, pfr: 0.1327, af: 6.3697, wtsd: 0.3143 },
      { name: 'af1.5-wtsd64', vpip: 0.3202, pfr: 0.1318, af: 1.5861, wtsd: 0.5177 },
      { name: 'af3.4-wtsd45', vpip: 0.3202, pfr: 0.131, af: 3.7047, wtsd: 0.3319 },
      { name: 'af2.3-wtsd52', vpip: 0.3221, pfr: 0.1323, af: 2.3999, wtsd: 0.3902 },
      { name: 'af4.8-wtsd48', vpip: 0.3213, pfr: 0.1312, af: 5.8979, wtsd: 0.3201 },
      { name: 'af1.6-wtsd59', vpip: 0.3204, pfr: 0.1288, af: 1.674, wtsd: 0.468 },
      { name: 'af5.6-wtsd47', vpip: 0.3214, pfr: 0.1332, af: 7.0342, wtsd: 0.3043 },
      { name: 'af4.6-wtsd50', vpip: 0.3206, pfr: 0.1315, af: 5.2846, wtsd: 0.3459 },
      { name: 'af5.0-wtsd46', vpip: 0.3211, pfr: 0.1306, af: 5.7357, wtsd: 0.3001 },
      { name: 'af2.8-wtsd50', vpip: 0.3217, pfr: 0.132, af: 2.9491, wtsd: 0.3617 },
      { name: 'af2.1-wtsd52', vpip: 0.3222, pfr: 0.1315, af: 2.2201, wtsd: 0.3866 },
      { name: 'af3.4-wtsd49', vpip: 0.3213, pfr: 0.1316, af: 3.7862, wtsd: 0.3366 },
      { name: 'af3.9-wtsd51', vpip: 0.3227, pfr: 0.1326, af: 4.4633, wtsd: 0.3561 },
      { name: 'af1.8-wtsd55', vpip: 0.3185, pfr: 0.1332, af: 1.9185, wtsd: 0.4184 },
      { name: 'af5.2-wtsd47', vpip: 0.322, pfr: 0.1315, af: 6.2096, wtsd: 0.3044 },
      { name: 'af0.5-wtsd75', vpip: 0.3224, pfr: 0.1318, af: 0.5169, wtsd: 0.6838 },
      { name: 'af3.0-wtsd48', vpip: 0.321, pfr: 0.1324, af: 3.3313, wtsd: 0.3456 },
      { name: 'af3.6-wtsd49', vpip: 0.3221, pfr: 0.1312, af: 4.0859, wtsd: 0.3374 },
      { name: 'af1.1-wtsd67', vpip: 0.3214, pfr: 0.132, af: 1.1406, wtsd: 0.5734 },
      { name: 'af4.0-wtsd48', vpip: 0.323, pfr: 0.1327, af: 4.5262, wtsd: 0.3212 },
      { name: 'af1.2-wtsd61', vpip: 0.3212, pfr: 0.1336, af: 1.2673, wtsd: 0.5104 },
      { name: 'af4.3-wtsd48', vpip: 0.3214, pfr: 0.1322, af: 4.8956, wtsd: 0.3183 },
      { name: 'af2.5-wtsd55', vpip: 0.3214, pfr: 0.1328, af: 2.7446, wtsd: 0.4077 },
      { name: 'af2.5-wtsd50', vpip: 0.321, pfr: 0.1317, af: 2.735, wtsd: 0.3646 },
    ],
  },
  '2-100': {
    '2-3p': [
      { name: 'gto', vpip: 0.7703, pfr: 0.4151, af: 1.8645, wtsd: 0.4512 },
      { name: 'af5.1-wtsd50', vpip: 0.7722, pfr: 0.4165, af: 6.5028, wtsd: 0.3158 },
      { name: 'af0.5-wtsd79', vpip: 0.7731, pfr: 0.4177, af: 0.6278, wtsd: 0.7102 },
      { name: 'af2.6-wtsd53', vpip: 0.7724, pfr: 0.4176, af: 2.9035, wtsd: 0.3795 },
      { name: 'af1.3-wtsd59', vpip: 0.7726, pfr: 0.4179, af: 1.5033, wtsd: 0.4776 },
      { name: 'af3.8-wtsd49', vpip: 0.7712, pfr: 0.4156, af: 4.3844, wtsd: 0.3144 },
      { name: 'af5.8-wtsd46', vpip: 0.7716, pfr: 0.4163, af: 7.1188, wtsd: 0.268 },
      { name: 'af4.5-wtsd47', vpip: 0.7718, pfr: 0.4176, af: 5.2082, wtsd: 0.2879 },
      { name: 'af0.9-wtsd70', vpip: 0.7713, pfr: 0.4163, af: 1.0887, wtsd: 0.6076 },
      { name: 'af3.2-wtsd49', vpip: 0.7721, pfr: 0.4185, af: 3.5835, wtsd: 0.3276 },
      { name: 'af1.5-wtsd70', vpip: 0.7711, pfr: 0.4171, af: 1.7892, wtsd: 0.623 },
      { name: 'af2.0-wtsd55', vpip: 0.7724, pfr: 0.417, af: 2.2059, wtsd: 0.4167 },
      { name: 'af0.6-wtsd72', vpip: 0.773, pfr: 0.4189, af: 0.7458, wtsd: 0.6293 },
      { name: 'af1.1-wtsd63', vpip: 0.7681, pfr: 0.42, af: 1.245, wtsd: 0.5246 },
      { name: 'af2.9-wtsd53', vpip: 0.7697, pfr: 0.4165, af: 3.3758, wtsd: 0.3715 },
      { name: 'af3.5-wtsd52', vpip: 0.7713, pfr: 0.4161, af: 4.2292, wtsd: 0.3534 },
      { name: 'af4.1-wtsd49', vpip: 0.7719, pfr: 0.4189, af: 4.9539, wtsd: 0.3112 },
      { name: 'af5.4-wtsd48', vpip: 0.772, pfr: 0.4175, af: 6.6811, wtsd: 0.2884 },
      { name: 'af1.5-wtsd64', vpip: 0.7715, pfr: 0.415, af: 1.7544, wtsd: 0.539 },
      { name: 'af3.4-wtsd45', vpip: 0.7716, pfr: 0.418, af: 3.588, wtsd: 0.2981 },
      { name: 'af2.3-wtsd52', vpip: 0.7723, pfr: 0.4167, af: 2.5072, wtsd: 0.384 },
      { name: 'af4.8-wtsd48', vpip: 0.771, pfr: 0.4179, af: 5.9534, wtsd: 0.2974 },
      { name: 'af1.6-wtsd59', vpip: 0.7685, pfr: 0.4201, af: 1.7955, wtsd: 0.4685 },
      { name: 'af5.6-wtsd47', vpip: 0.7725, pfr: 0.4168, af: 6.9137, wtsd: 0.2751 },
      { name: 'af4.6-wtsd50', vpip: 0.7734, pfr: 0.4175, af: 5.699, wtsd: 0.3269 },
      { name: 'af5.0-wtsd46', vpip: 0.7721, pfr: 0.4162, af: 5.643, wtsd: 0.2708 },
      { name: 'af2.8-wtsd50', vpip: 0.7718, pfr: 0.4168, af: 3.0579, wtsd: 0.3507 },
      { name: 'af2.1-wtsd52', vpip: 0.7705, pfr: 0.4182, af: 2.268, wtsd: 0.383 },
      { name: 'af3.4-wtsd49', vpip: 0.7724, pfr: 0.4166, af: 3.8275, wtsd: 0.3205 },
      { name: 'af3.9-wtsd51', vpip: 0.7725, pfr: 0.4163, af: 4.7776, wtsd: 0.3394 },
      { name: 'af1.8-wtsd55', vpip: 0.7688, pfr: 0.4203, af: 2.0179, wtsd: 0.4194 },
      { name: 'af5.2-wtsd47', vpip: 0.7722, pfr: 0.4174, af: 6.2754, wtsd: 0.2764 },
      { name: 'af0.5-wtsd75', vpip: 0.7721, pfr: 0.4169, af: 0.6696, wtsd: 0.6688 },
      { name: 'af3.0-wtsd48', vpip: 0.7716, pfr: 0.4167, af: 3.314, wtsd: 0.3254 },
      { name: 'af3.6-wtsd49', vpip: 0.7712, pfr: 0.4156, af: 4.1493, wtsd: 0.3196 },
      { name: 'af1.1-wtsd67', vpip: 0.7727, pfr: 0.4187, af: 1.2926, wtsd: 0.5727 },
      { name: 'af4.0-wtsd48', vpip: 0.773, pfr: 0.4189, af: 4.6295, wtsd: 0.3006 },
      { name: 'af1.2-wtsd61', vpip: 0.7715, pfr: 0.4164, af: 1.4012, wtsd: 0.5076 },
      { name: 'af4.3-wtsd48', vpip: 0.7711, pfr: 0.4172, af: 5.0303, wtsd: 0.2993 },
      { name: 'af2.5-wtsd55', vpip: 0.7713, pfr: 0.4175, af: 2.8511, wtsd: 0.4079 },
      { name: 'af2.5-wtsd50', vpip: 0.7712, pfr: 0.4168, af: 2.7139, wtsd: 0.3546 },
    ],
    '4-6p': [
      { name: 'gto', vpip: 0.5255, pfr: 0.2019, af: 1.7212, wtsd: 0.4303 },
      { name: 'af5.1-wtsd50', vpip: 0.5267, pfr: 0.2014, af: 6.1022, wtsd: 0.2994 },
      { name: 'af0.5-wtsd79', vpip: 0.526, pfr: 0.2027, af: 0.471, wtsd: 0.7066 },
      { name: 'af2.6-wtsd53', vpip: 0.5261, pfr: 0.2009, af: 2.7993, wtsd: 0.3514 },
      { name: 'af1.3-wtsd59', vpip: 0.5264, pfr: 0.202, af: 1.3722, wtsd: 0.4589 },
      { name: 'af3.8-wtsd49', vpip: 0.5265, pfr: 0.2003, af: 4.2939, wtsd: 0.299 },
      { name: 'af5.8-wtsd46', vpip: 0.5268, pfr: 0.2016, af: 6.9045, wtsd: 0.2656 },
      { name: 'af4.5-wtsd47', vpip: 0.5267, pfr: 0.2022, af: 5.0717, wtsd: 0.2812 },
      { name: 'af0.9-wtsd70', vpip: 0.5263, pfr: 0.201, af: 0.9166, wtsd: 0.5905 },
      { name: 'af3.2-wtsd49', vpip: 0.5247, pfr: 0.2042, af: 3.5517, wtsd: 0.3169 },
      { name: 'af1.5-wtsd70', vpip: 0.5265, pfr: 0.203, af: 1.6547, wtsd: 0.5829 },
      { name: 'af2.0-wtsd55', vpip: 0.5268, pfr: 0.2028, af: 2.0925, wtsd: 0.3893 },
      { name: 'af0.6-wtsd72', vpip: 0.5261, pfr: 0.2016, af: 0.588, wtsd: 0.6173 },
      { name: 'af1.1-wtsd63', vpip: 0.5246, pfr: 0.2034, af: 1.0689, wtsd: 0.5106 },
      { name: 'af2.9-wtsd53', vpip: 0.523, pfr: 0.2009, af: 3.2393, wtsd: 0.3437 },
      { name: 'af3.5-wtsd52', vpip: 0.5265, pfr: 0.2015, af: 3.9922, wtsd: 0.3298 },
      { name: 'af4.1-wtsd49', vpip: 0.5259, pfr: 0.2017, af: 4.7301, wtsd: 0.2983 },
      { name: 'af5.4-wtsd48', vpip: 0.5254, pfr: 0.2005, af: 6.4198, wtsd: 0.2785 },
      { name: 'af1.5-wtsd64', vpip: 0.5256, pfr: 0.2024, af: 1.5856, wtsd: 0.506 },
      { name: 'af3.4-wtsd45', vpip: 0.525, pfr: 0.2009, af: 3.5439, wtsd: 0.2977 },
      { name: 'af2.3-wtsd52', vpip: 0.5257, pfr: 0.2021, af: 2.4019, wtsd: 0.3606 },
      { name: 'af4.8-wtsd48', vpip: 0.527, pfr: 0.2021, af: 5.6004, wtsd: 0.2884 },
      { name: 'af1.6-wtsd59', vpip: 0.5241, pfr: 0.2042, af: 1.7046, wtsd: 0.4384 },
      { name: 'af5.6-wtsd47', vpip: 0.5262, pfr: 0.2006, af: 6.6678, wtsd: 0.2731 },
      { name: 'af4.6-wtsd50', vpip: 0.5264, pfr: 0.2012, af: 5.3715, wtsd: 0.3056 },
      { name: 'af5.0-wtsd46', vpip: 0.5269, pfr: 0.2009, af: 5.6666, wtsd: 0.2672 },
      { name: 'af2.8-wtsd50', vpip: 0.5273, pfr: 0.202, af: 2.9776, wtsd: 0.3307 },
      { name: 'af2.1-wtsd52', vpip: 0.5257, pfr: 0.2005, af: 2.1784, wtsd: 0.3631 },
      { name: 'af3.4-wtsd49', vpip: 0.5262, pfr: 0.2014, af: 3.7759, wtsd: 0.3054 },
      { name: 'af3.9-wtsd51', vpip: 0.5266, pfr: 0.2017, af: 4.5411, wtsd: 0.3178 },
      { name: 'af1.8-wtsd55', vpip: 0.5229, pfr: 0.2031, af: 1.8962, wtsd: 0.4064 },
      { name: 'af5.2-wtsd47', vpip: 0.5248, pfr: 0.2009, af: 6.1096, wtsd: 0.2719 },
      { name: 'af0.5-wtsd75', vpip: 0.5263, pfr: 0.2029, af: 0.5223, wtsd: 0.6583 },
      { name: 'af3.0-wtsd48', vpip: 0.5261, pfr: 0.2014, af: 3.2917, wtsd: 0.3116 },
      { name: 'af3.6-wtsd49', vpip: 0.5268, pfr: 0.2016, af: 4.0639, wtsd: 0.3042 },
      { name: 'af1.1-wtsd67', vpip: 0.5262, pfr: 0.2015, af: 1.1147, wtsd: 0.5504 },
      { name: 'af4.0-wtsd48', vpip: 0.5252, pfr: 0.2007, af: 4.5302, wtsd: 0.2908 },
      { name: 'af1.2-wtsd61', vpip: 0.5272, pfr: 0.2019, af: 1.2524, wtsd: 0.4863 },
      { name: 'af4.3-wtsd48', vpip: 0.527, pfr: 0.2025, af: 4.9409, wtsd: 0.2924 },
      { name: 'af2.5-wtsd55', vpip: 0.5253, pfr: 0.2024, af: 2.6737, wtsd: 0.3781 },
      { name: 'af2.5-wtsd50', vpip: 0.5259, pfr: 0.2018, af: 2.6384, wtsd: 0.3396 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.4138, pfr: 0.1277, af: 1.5978, wtsd: 0.4275 },
      { name: 'af5.1-wtsd50', vpip: 0.4137, pfr: 0.128, af: 5.5042, wtsd: 0.3192 },
      { name: 'af0.5-wtsd79', vpip: 0.4132, pfr: 0.1278, af: 0.3847, wtsd: 0.71 },
      { name: 'af2.6-wtsd53', vpip: 0.4135, pfr: 0.1276, af: 2.6033, wtsd: 0.3606 },
      { name: 'af1.3-wtsd59', vpip: 0.4135, pfr: 0.1284, af: 1.2546, wtsd: 0.4618 },
      { name: 'af3.8-wtsd49', vpip: 0.4137, pfr: 0.1275, af: 4.0876, wtsd: 0.3151 },
      { name: 'af5.8-wtsd46', vpip: 0.4146, pfr: 0.128, af: 6.3438, wtsd: 0.29 },
      { name: 'af4.5-wtsd47', vpip: 0.4129, pfr: 0.1275, af: 4.7749, wtsd: 0.3033 },
      { name: 'af0.9-wtsd70', vpip: 0.4134, pfr: 0.1278, af: 0.8139, wtsd: 0.5864 },
      { name: 'af3.2-wtsd49', vpip: 0.4106, pfr: 0.128, af: 3.3145, wtsd: 0.3279 },
      { name: 'af1.5-wtsd70', vpip: 0.4142, pfr: 0.1276, af: 1.5287, wtsd: 0.5646 },
      { name: 'af2.0-wtsd55', vpip: 0.4134, pfr: 0.1284, af: 1.9539, wtsd: 0.3952 },
      { name: 'af0.6-wtsd72', vpip: 0.4133, pfr: 0.1279, af: 0.4901, wtsd: 0.6203 },
      { name: 'af1.1-wtsd63', vpip: 0.4075, pfr: 0.129, af: 0.9822, wtsd: 0.514 },
      { name: 'af2.9-wtsd53', vpip: 0.4138, pfr: 0.1295, af: 2.929, wtsd: 0.3609 },
      { name: 'af3.5-wtsd52', vpip: 0.4134, pfr: 0.1282, af: 3.6695, wtsd: 0.3436 },
      { name: 'af4.1-wtsd49', vpip: 0.413, pfr: 0.1272, af: 4.3917, wtsd: 0.3159 },
      { name: 'af5.4-wtsd48', vpip: 0.4132, pfr: 0.1278, af: 5.8365, wtsd: 0.3042 },
      { name: 'af1.5-wtsd64', vpip: 0.4131, pfr: 0.127, af: 1.4549, wtsd: 0.4949 },
      { name: 'af3.4-wtsd45', vpip: 0.4135, pfr: 0.1279, af: 3.2996, wtsd: 0.3186 },
      { name: 'af2.3-wtsd52', vpip: 0.4124, pfr: 0.1282, af: 2.2674, wtsd: 0.37 },
      { name: 'af4.8-wtsd48', vpip: 0.4143, pfr: 0.128, af: 5.1185, wtsd: 0.3069 },
      { name: 'af1.6-wtsd59', vpip: 0.4111, pfr: 0.1293, af: 1.5685, wtsd: 0.4416 },
      { name: 'af5.6-wtsd47', vpip: 0.4137, pfr: 0.1277, af: 6.0478, wtsd: 0.2979 },
      { name: 'af4.6-wtsd50', vpip: 0.4145, pfr: 0.128, af: 4.8852, wtsd: 0.3245 },
      { name: 'af5.0-wtsd46', vpip: 0.4137, pfr: 0.1281, af: 5.385, wtsd: 0.291 },
      { name: 'af2.8-wtsd50', vpip: 0.4125, pfr: 0.1272, af: 2.8548, wtsd: 0.3424 },
      { name: 'af2.1-wtsd52', vpip: 0.4131, pfr: 0.1278, af: 2.063, wtsd: 0.3754 },
      { name: 'af3.4-wtsd49', vpip: 0.4136, pfr: 0.1279, af: 3.5777, wtsd: 0.3199 },
      { name: 'af3.9-wtsd51', vpip: 0.4142, pfr: 0.1276, af: 4.1734, wtsd: 0.3338 },
      { name: 'af1.8-wtsd55', vpip: 0.4104, pfr: 0.1293, af: 1.7722, wtsd: 0.4095 },
      { name: 'af5.2-wtsd47', vpip: 0.4132, pfr: 0.1269, af: 5.6121, wtsd: 0.2947 },
      { name: 'af0.5-wtsd75', vpip: 0.4134, pfr: 0.1273, af: 0.4273, wtsd: 0.6564 },
      { name: 'af3.0-wtsd48', vpip: 0.4118, pfr: 0.1274, af: 3.1865, wtsd: 0.3246 },
      { name: 'af3.6-wtsd49', vpip: 0.4134, pfr: 0.128, af: 3.796, wtsd: 0.3198 },
      { name: 'af1.1-wtsd67', vpip: 0.4126, pfr: 0.1275, af: 1.003, wtsd: 0.5458 },
      { name: 'af4.0-wtsd48', vpip: 0.4139, pfr: 0.1273, af: 4.2115, wtsd: 0.3098 },
      { name: 'af1.2-wtsd61', vpip: 0.4133, pfr: 0.1284, af: 1.1507, wtsd: 0.4872 },
      { name: 'af4.3-wtsd48', vpip: 0.4138, pfr: 0.1273, af: 4.5723, wtsd: 0.3086 },
      { name: 'af2.5-wtsd55', vpip: 0.4131, pfr: 0.1274, af: 2.4886, wtsd: 0.3813 },
      { name: 'af2.5-wtsd50', vpip: 0.4131, pfr: 0.1278, af: 2.5467, wtsd: 0.3482 },
    ],
  },
  '3-0': {
    '2-3p': [],
    '4-6p': [
      { name: 'gto', vpip: 0.3628, pfr: 0.1828, af: 1.8552, wtsd: 0.4859 },
      { name: 'af5.1-wtsd50', vpip: 0.3634, pfr: 0.1825, af: 6.0863, wtsd: 0.3516 },
      { name: 'af0.5-wtsd79', vpip: 0.3616, pfr: 0.1824, af: 0.6051, wtsd: 0.7356 },
      { name: 'af2.6-wtsd53', vpip: 0.3625, pfr: 0.1834, af: 2.8126, wtsd: 0.4173 },
      { name: 'af1.3-wtsd59', vpip: 0.3627, pfr: 0.1831, af: 1.5326, wtsd: 0.5112 },
      { name: 'af3.8-wtsd49', vpip: 0.3624, pfr: 0.1828, af: 4.2014, wtsd: 0.3542 },
      { name: 'af5.8-wtsd46', vpip: 0.3624, pfr: 0.1829, af: 6.6498, wtsd: 0.3147 },
      { name: 'af4.5-wtsd47', vpip: 0.3636, pfr: 0.1835, af: 4.9847, wtsd: 0.3336 },
      { name: 'af0.9-wtsd70', vpip: 0.3618, pfr: 0.1823, af: 1.0809, wtsd: 0.6343 },
      { name: 'af3.2-wtsd49', vpip: 0.3622, pfr: 0.1829, af: 3.5185, wtsd: 0.372 },
      { name: 'af1.5-wtsd70', vpip: 0.363, pfr: 0.1831, af: 1.7218, wtsd: 0.6506 },
      { name: 'af2.0-wtsd55', vpip: 0.3624, pfr: 0.1824, af: 2.1876, wtsd: 0.4523 },
      { name: 'af0.6-wtsd72', vpip: 0.362, pfr: 0.1821, af: 0.7355, wtsd: 0.6621 },
      { name: 'af1.1-wtsd63', vpip: 0.3606, pfr: 0.183, af: 1.2538, wtsd: 0.5547 },
      { name: 'af2.9-wtsd53', vpip: 0.3617, pfr: 0.1838, af: 3.2025, wtsd: 0.4175 },
      { name: 'af3.5-wtsd52', vpip: 0.3633, pfr: 0.1838, af: 3.9629, wtsd: 0.3934 },
      { name: 'af4.1-wtsd49', vpip: 0.3636, pfr: 0.1834, af: 4.6983, wtsd: 0.3515 },
      { name: 'af5.4-wtsd48', vpip: 0.3626, pfr: 0.1833, af: 6.2951, wtsd: 0.3266 },
      { name: 'af1.5-wtsd64', vpip: 0.3624, pfr: 0.1827, af: 1.7095, wtsd: 0.5709 },
      { name: 'af3.4-wtsd45', vpip: 0.363, pfr: 0.183, af: 3.5598, wtsd: 0.3462 },
      { name: 'af2.3-wtsd52', vpip: 0.3625, pfr: 0.1826, af: 2.4835, wtsd: 0.4222 },
      { name: 'af4.8-wtsd48', vpip: 0.3632, pfr: 0.1828, af: 5.5542, wtsd: 0.3393 },
      { name: 'af1.6-wtsd59', vpip: 0.3604, pfr: 0.1833, af: 1.8019, wtsd: 0.506 },
      { name: 'af5.6-wtsd47', vpip: 0.3632, pfr: 0.1823, af: 6.4362, wtsd: 0.3183 },
      { name: 'af4.6-wtsd50', vpip: 0.3622, pfr: 0.1826, af: 5.3501, wtsd: 0.3616 },
      { name: 'af5.0-wtsd46', vpip: 0.3625, pfr: 0.1817, af: 5.5432, wtsd: 0.3134 },
      { name: 'af2.8-wtsd50', vpip: 0.3616, pfr: 0.1826, af: 3.0228, wtsd: 0.3879 },
      { name: 'af2.1-wtsd52', vpip: 0.3635, pfr: 0.1827, af: 2.2637, wtsd: 0.4225 },
      { name: 'af3.4-wtsd49', vpip: 0.3634, pfr: 0.1831, af: 3.6608, wtsd: 0.3634 },
      { name: 'af3.9-wtsd51', vpip: 0.363, pfr: 0.1829, af: 4.5041, wtsd: 0.3766 },
      { name: 'af1.8-wtsd55', vpip: 0.3609, pfr: 0.1843, af: 1.9431, wtsd: 0.4644 },
      { name: 'af5.2-wtsd47', vpip: 0.3632, pfr: 0.1832, af: 5.9499, wtsd: 0.321 },
      { name: 'af0.5-wtsd75', vpip: 0.3612, pfr: 0.1821, af: 0.6661, wtsd: 0.6964 },
      { name: 'af3.0-wtsd48', vpip: 0.3635, pfr: 0.1837, af: 3.2303, wtsd: 0.3719 },
      { name: 'af3.6-wtsd49', vpip: 0.3629, pfr: 0.1827, af: 3.9546, wtsd: 0.3611 },
      { name: 'af1.1-wtsd67', vpip: 0.3626, pfr: 0.1827, af: 1.269, wtsd: 0.6022 },
      { name: 'af4.0-wtsd48', vpip: 0.3633, pfr: 0.1824, af: 4.3807, wtsd: 0.3432 },
      { name: 'af1.2-wtsd61', vpip: 0.3635, pfr: 0.1825, af: 1.4198, wtsd: 0.5354 },
      { name: 'af4.3-wtsd48', vpip: 0.3624, pfr: 0.1831, af: 4.8695, wtsd: 0.3424 },
      { name: 'af2.5-wtsd55', vpip: 0.362, pfr: 0.1828, af: 2.7179, wtsd: 0.4473 },
      { name: 'af2.5-wtsd50', vpip: 0.3623, pfr: 0.1826, af: 2.6793, wtsd: 0.4011 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2422, pfr: 0.1219, af: 1.8471, wtsd: 0.4926 },
      { name: 'af5.1-wtsd50', vpip: 0.2427, pfr: 0.1217, af: 6.0284, wtsd: 0.3756 },
      { name: 'af0.5-wtsd79', vpip: 0.2433, pfr: 0.1218, af: 0.5901, wtsd: 0.749 },
      { name: 'af2.6-wtsd53', vpip: 0.2422, pfr: 0.1214, af: 2.8295, wtsd: 0.4322 },
      { name: 'af1.3-wtsd59', vpip: 0.2425, pfr: 0.1214, af: 1.5291, wtsd: 0.5189 },
      { name: 'af3.8-wtsd49', vpip: 0.243, pfr: 0.1221, af: 4.2409, wtsd: 0.3765 },
      { name: 'af5.8-wtsd46', vpip: 0.2426, pfr: 0.1215, af: 6.7465, wtsd: 0.3385 },
      { name: 'af4.5-wtsd47', vpip: 0.2432, pfr: 0.1223, af: 5.0279, wtsd: 0.3595 },
      { name: 'af0.9-wtsd70', vpip: 0.243, pfr: 0.1217, af: 1.0628, wtsd: 0.6427 },
      { name: 'af3.2-wtsd49', vpip: 0.2429, pfr: 0.1224, af: 3.524, wtsd: 0.3832 },
      { name: 'af1.5-wtsd70', vpip: 0.2425, pfr: 0.1215, af: 1.7028, wtsd: 0.6543 },
      { name: 'af2.0-wtsd55', vpip: 0.243, pfr: 0.122, af: 2.1758, wtsd: 0.4652 },
      { name: 'af0.6-wtsd72', vpip: 0.2427, pfr: 0.1213, af: 0.7218, wtsd: 0.6704 },
      { name: 'af1.1-wtsd63', vpip: 0.2414, pfr: 0.1233, af: 1.2475, wtsd: 0.566 },
      { name: 'af2.9-wtsd53', vpip: 0.2417, pfr: 0.1219, af: 3.2248, wtsd: 0.4231 },
      { name: 'af3.5-wtsd52', vpip: 0.2421, pfr: 0.1213, af: 3.9569, wtsd: 0.4101 },
      { name: 'af4.1-wtsd49', vpip: 0.243, pfr: 0.1214, af: 4.665, wtsd: 0.378 },
      { name: 'af5.4-wtsd48', vpip: 0.2429, pfr: 0.1216, af: 6.4047, wtsd: 0.3534 },
      { name: 'af1.5-wtsd64', vpip: 0.243, pfr: 0.122, af: 1.698, wtsd: 0.574 },
      { name: 'af3.4-wtsd45', vpip: 0.2434, pfr: 0.1224, af: 3.6659, wtsd: 0.3648 },
      { name: 'af2.3-wtsd52', vpip: 0.243, pfr: 0.1217, af: 2.4716, wtsd: 0.4369 },
      { name: 'af4.8-wtsd48', vpip: 0.2435, pfr: 0.1218, af: 5.6326, wtsd: 0.3622 },
      { name: 'af1.6-wtsd59', vpip: 0.2392, pfr: 0.1213, af: 1.8176, wtsd: 0.5084 },
      { name: 'af5.6-wtsd47', vpip: 0.243, pfr: 0.122, af: 6.637, wtsd: 0.3462 },
      { name: 'af4.6-wtsd50', vpip: 0.2433, pfr: 0.1217, af: 5.4107, wtsd: 0.3847 },
      { name: 'af5.0-wtsd46', vpip: 0.243, pfr: 0.1217, af: 5.4684, wtsd: 0.3416 },
      { name: 'af2.8-wtsd50', vpip: 0.2432, pfr: 0.1215, af: 2.9862, wtsd: 0.4084 },
      { name: 'af2.1-wtsd52', vpip: 0.2426, pfr: 0.1212, af: 2.2567, wtsd: 0.4344 },
      { name: 'af3.4-wtsd49', vpip: 0.2431, pfr: 0.1215, af: 3.7359, wtsd: 0.3812 },
      { name: 'af3.9-wtsd51', vpip: 0.2431, pfr: 0.1214, af: 4.5546, wtsd: 0.3974 },
      { name: 'af1.8-wtsd55', vpip: 0.2423, pfr: 0.1222, af: 1.9937, wtsd: 0.4684 },
      { name: 'af5.2-wtsd47', vpip: 0.2422, pfr: 0.1207, af: 5.9652, wtsd: 0.3482 },
      { name: 'af0.5-wtsd75', vpip: 0.2426, pfr: 0.1214, af: 0.646, wtsd: 0.7049 },
      { name: 'af3.0-wtsd48', vpip: 0.2434, pfr: 0.1215, af: 3.2994, wtsd: 0.3871 },
      { name: 'af3.6-wtsd49', vpip: 0.2433, pfr: 0.1219, af: 4.0056, wtsd: 0.3806 },
      { name: 'af1.1-wtsd67', vpip: 0.2429, pfr: 0.1215, af: 1.2605, wtsd: 0.6076 },
      { name: 'af4.0-wtsd48', vpip: 0.2434, pfr: 0.1218, af: 4.4099, wtsd: 0.3662 },
      { name: 'af1.2-wtsd61', vpip: 0.2427, pfr: 0.1215, af: 1.427, wtsd: 0.5419 },
      { name: 'af4.3-wtsd48', vpip: 0.243, pfr: 0.1217, af: 4.8818, wtsd: 0.3622 },
      { name: 'af2.5-wtsd55', vpip: 0.2425, pfr: 0.1211, af: 2.717, wtsd: 0.4592 },
      { name: 'af2.5-wtsd50', vpip: 0.2432, pfr: 0.1215, af: 2.6569, wtsd: 0.4152 },
    ],
  },
  '3-50': {
    '2-3p': [],
    '4-6p': [
      { name: 'gto', vpip: 0.411, pfr: 0.2023, af: 1.8284, wtsd: 0.4819 },
      { name: 'af5.1-wtsd50', vpip: 0.4123, pfr: 0.203, af: 5.8791, wtsd: 0.3663 },
      { name: 'af0.5-wtsd79', vpip: 0.4132, pfr: 0.203, af: 0.5721, wtsd: 0.7324 },
      { name: 'af2.6-wtsd53', vpip: 0.4118, pfr: 0.2028, af: 2.8016, wtsd: 0.419 },
      { name: 'af1.3-wtsd59', vpip: 0.4111, pfr: 0.2021, af: 1.4816, wtsd: 0.5071 },
      { name: 'af3.8-wtsd49', vpip: 0.4129, pfr: 0.203, af: 4.1605, wtsd: 0.3669 },
      { name: 'af5.8-wtsd46', vpip: 0.4127, pfr: 0.2029, af: 6.5122, wtsd: 0.3288 },
      { name: 'af4.5-wtsd47', vpip: 0.4115, pfr: 0.2018, af: 4.8995, wtsd: 0.3455 },
      { name: 'af0.9-wtsd70', vpip: 0.4106, pfr: 0.2028, af: 1.0436, wtsd: 0.6285 },
      { name: 'af3.2-wtsd49', vpip: 0.4108, pfr: 0.2034, af: 3.4355, wtsd: 0.3841 },
      { name: 'af1.5-wtsd70', vpip: 0.4117, pfr: 0.2027, af: 1.7101, wtsd: 0.6367 },
      { name: 'af2.0-wtsd55', vpip: 0.411, pfr: 0.2023, af: 2.1865, wtsd: 0.4513 },
      { name: 'af0.6-wtsd72', vpip: 0.4119, pfr: 0.203, af: 0.6837, wtsd: 0.6579 },
      { name: 'af1.1-wtsd63', vpip: 0.4099, pfr: 0.2027, af: 1.1955, wtsd: 0.5533 },
      { name: 'af2.9-wtsd53', vpip: 0.4111, pfr: 0.2036, af: 3.1387, wtsd: 0.412 },
      { name: 'af3.5-wtsd52', vpip: 0.4118, pfr: 0.2028, af: 3.9362, wtsd: 0.3998 },
      { name: 'af4.1-wtsd49', vpip: 0.4116, pfr: 0.203, af: 4.6955, wtsd: 0.3621 },
      { name: 'af5.4-wtsd48', vpip: 0.4126, pfr: 0.2026, af: 6.0475, wtsd: 0.3484 },
      { name: 'af1.5-wtsd64', vpip: 0.4117, pfr: 0.2021, af: 1.6784, wtsd: 0.5645 },
      { name: 'af3.4-wtsd45', vpip: 0.4107, pfr: 0.2021, af: 3.4248, wtsd: 0.3537 },
      { name: 'af2.3-wtsd52', vpip: 0.4122, pfr: 0.2032, af: 2.4712, wtsd: 0.4231 },
      { name: 'af4.8-wtsd48', vpip: 0.4115, pfr: 0.2024, af: 5.4665, wtsd: 0.3556 },
      { name: 'af1.6-wtsd59', vpip: 0.4098, pfr: 0.2038, af: 1.8061, wtsd: 0.4976 },
      { name: 'af5.6-wtsd47', vpip: 0.4125, pfr: 0.2021, af: 6.2636, wtsd: 0.3363 },
      { name: 'af4.6-wtsd50', vpip: 0.4119, pfr: 0.203, af: 5.2197, wtsd: 0.3752 },
      { name: 'af5.0-wtsd46', vpip: 0.4127, pfr: 0.2031, af: 5.3498, wtsd: 0.3304 },
      { name: 'af2.8-wtsd50', vpip: 0.4124, pfr: 0.2028, af: 2.9739, wtsd: 0.3977 },
      { name: 'af2.1-wtsd52', vpip: 0.4122, pfr: 0.2029, af: 2.2158, wtsd: 0.4215 },
      { name: 'af3.4-wtsd49', vpip: 0.4112, pfr: 0.2035, af: 3.7207, wtsd: 0.3704 },
      { name: 'af3.9-wtsd51', vpip: 0.4124, pfr: 0.2034, af: 4.3913, wtsd: 0.3907 },
      { name: 'af1.8-wtsd55', vpip: 0.4104, pfr: 0.2017, af: 1.9863, wtsd: 0.4517 },
      { name: 'af5.2-wtsd47', vpip: 0.4108, pfr: 0.202, af: 5.8113, wtsd: 0.3363 },
      { name: 'af0.5-wtsd75', vpip: 0.4116, pfr: 0.2019, af: 0.6224, wtsd: 0.6913 },
      { name: 'af3.0-wtsd48', vpip: 0.4125, pfr: 0.2038, af: 3.2318, wtsd: 0.3757 },
      { name: 'af3.6-wtsd49', vpip: 0.4113, pfr: 0.2021, af: 3.9605, wtsd: 0.3701 },
      { name: 'af1.1-wtsd67', vpip: 0.4116, pfr: 0.2025, af: 1.2443, wtsd: 0.5938 },
      { name: 'af4.0-wtsd48', vpip: 0.4119, pfr: 0.2016, af: 4.3508, wtsd: 0.3542 },
      { name: 'af1.2-wtsd61', vpip: 0.4127, pfr: 0.2025, af: 1.3801, wtsd: 0.5322 },
      { name: 'af4.3-wtsd48', vpip: 0.4115, pfr: 0.2022, af: 4.7414, wtsd: 0.3526 },
      { name: 'af2.5-wtsd55', vpip: 0.4115, pfr: 0.2029, af: 2.7386, wtsd: 0.445 },
      { name: 'af2.5-wtsd50', vpip: 0.4124, pfr: 0.2035, af: 2.6584, wtsd: 0.4014 },
    ],
    '7-9p': [
      { name: 'gto', vpip: 0.2953, pfr: 0.1411, af: 1.7987, wtsd: 0.4981 },
      { name: 'af5.1-wtsd50', vpip: 0.2952, pfr: 0.1411, af: 5.6021, wtsd: 0.4014 },
      { name: 'af0.5-wtsd79', vpip: 0.2948, pfr: 0.1411, af: 0.5427, wtsd: 0.745 },
      { name: 'af2.6-wtsd53', vpip: 0.2957, pfr: 0.1409, af: 2.7362, wtsd: 0.4433 },
      { name: 'af1.3-wtsd59', vpip: 0.2957, pfr: 0.1416, af: 1.4641, wtsd: 0.5238 },
      { name: 'af3.8-wtsd49', vpip: 0.2946, pfr: 0.1411, af: 4.1261, wtsd: 0.3957 },
      { name: 'af5.8-wtsd46', vpip: 0.2957, pfr: 0.1416, af: 6.3433, wtsd: 0.3648 },
      { name: 'af4.5-wtsd47', vpip: 0.2943, pfr: 0.1419, af: 4.7725, wtsd: 0.3792 },
      { name: 'af0.9-wtsd70', vpip: 0.2949, pfr: 0.1413, af: 1.011, wtsd: 0.6423 },
      { name: 'af3.2-wtsd49', vpip: 0.2926, pfr: 0.1407, af: 3.372, wtsd: 0.4048 },
      { name: 'af1.5-wtsd70', vpip: 0.2943, pfr: 0.1416, af: 1.6493, wtsd: 0.6509 },
      { name: 'af2.0-wtsd55', vpip: 0.2949, pfr: 0.1412, af: 2.1279, wtsd: 0.4701 },
      { name: 'af0.6-wtsd72', vpip: 0.295, pfr: 0.1416, af: 0.6643, wtsd: 0.67 },
      { name: 'af1.1-wtsd63', vpip: 0.2936, pfr: 0.1413, af: 1.1876, wtsd: 0.5736 },
      { name: 'af2.9-wtsd53', vpip: 0.2963, pfr: 0.1427, af: 3.0909, wtsd: 0.4437 },
      { name: 'af3.5-wtsd52', vpip: 0.2957, pfr: 0.1419, af: 3.7672, wtsd: 0.4289 },
      { name: 'af4.1-wtsd49', vpip: 0.2951, pfr: 0.1415, af: 4.4753, wtsd: 0.3981 },
      { name: 'af5.4-wtsd48', vpip: 0.2963, pfr: 0.1423, af: 5.8067, wtsd: 0.3853 },
      { name: 'af1.5-wtsd64', vpip: 0.296, pfr: 0.1417, af: 1.6364, wtsd: 0.5718 },
      { name: 'af3.4-wtsd45', vpip: 0.295, pfr: 0.1414, af: 3.356, wtsd: 0.3844 },
      { name: 'af2.3-wtsd52', vpip: 0.2952, pfr: 0.1414, af: 2.4461, wtsd: 0.4428 },
      { name: 'af4.8-wtsd48', vpip: 0.2952, pfr: 0.1413, af: 5.1692, wtsd: 0.3891 },
      { name: 'af1.6-wtsd59', vpip: 0.2943, pfr: 0.1425, af: 1.7544, wtsd: 0.5105 },
      { name: 'af5.6-wtsd47', vpip: 0.2952, pfr: 0.1412, af: 6.0208, wtsd: 0.3754 },
      { name: 'af4.6-wtsd50', vpip: 0.2952, pfr: 0.1413, af: 4.928, wtsd: 0.4108 },
      { name: 'af5.0-wtsd46', vpip: 0.2954, pfr: 0.142, af: 5.3391, wtsd: 0.3669 },
      { name: 'af2.8-wtsd50', vpip: 0.296, pfr: 0.1413, af: 2.9587, wtsd: 0.421 },
      { name: 'af2.1-wtsd52', vpip: 0.2955, pfr: 0.1416, af: 2.1997, wtsd: 0.4458 },
      { name: 'af3.4-wtsd49', vpip: 0.2946, pfr: 0.1405, af: 3.5918, wtsd: 0.4005 },
      { name: 'af3.9-wtsd51', vpip: 0.2961, pfr: 0.1413, af: 4.2637, wtsd: 0.4185 },
      { name: 'af1.8-wtsd55', vpip: 0.2935, pfr: 0.1419, af: 1.9435, wtsd: 0.4758 },
      { name: 'af5.2-wtsd47', vpip: 0.2953, pfr: 0.1414, af: 5.5985, wtsd: 0.3741 },
      { name: 'af0.5-wtsd75', vpip: 0.2955, pfr: 0.141, af: 0.5967, wtsd: 0.7034 },
      { name: 'af3.0-wtsd48', vpip: 0.2956, pfr: 0.1414, af: 3.2196, wtsd: 0.4024 },
      { name: 'af3.6-wtsd49', vpip: 0.2946, pfr: 0.1409, af: 3.8718, wtsd: 0.4009 },
      { name: 'af1.1-wtsd67', vpip: 0.2962, pfr: 0.1414, af: 1.214, wtsd: 0.6033 },
      { name: 'af4.0-wtsd48', vpip: 0.2959, pfr: 0.1418, af: 4.2175, wtsd: 0.3875 },
      { name: 'af1.2-wtsd61', vpip: 0.2954, pfr: 0.1414, af: 1.3503, wtsd: 0.5465 },
      { name: 'af4.3-wtsd48', vpip: 0.2949, pfr: 0.1406, af: 4.6012, wtsd: 0.3869 },
      { name: 'af2.5-wtsd55', vpip: 0.2959, pfr: 0.1421, af: 2.6173, wtsd: 0.4694 },
      { name: 'af2.5-wtsd50', vpip: 0.2955, pfr: 0.1421, af: 2.6494, wtsd: 0.424 },
    ],
  },
}

/**
 * 翻前档位名称提示清单（三维：盲注结构 → 人数范围 → 档位名）
 * 用于在 strategyProfile.config.ts 中通过 HINTS['format']['range']['name'] 引用档位时获得 IDE JSDoc 悬浮提示
 * @example PREFLOP_PROFILE_NAME_HINTS_BY_FORMAT['2-0']['7-9p']['gto']
 */
export const PREFLOP_PROFILE_NAME_HINTS_BY_FORMAT = {
  '2-0': {
    '2-3p': {
      /** VPIP 65.6%，PFR 39.8%，AF 1.84，WTSD 46.9% */
      'gto': 'gto' as const,
      /** VPIP 95.3%，PFR 25.0%，AF 1.80，WTSD 42.6% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 20.3%，PFR 11.3%，AF 1.72，WTSD 55.1% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 92.6%，PFR 80.3%，AF 2.08，WTSD 45.0% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 73.3%，PFR 54.0%，AF 1.95，WTSD 45.5% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 81.8%，PFR 20.4%，AF 1.78，WTSD 44.9% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 94.8%，PFR 52.3%，AF 1.87，WTSD 43.7% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 59.2%，PFR 16.2%，AF 1.72，WTSD 48.0% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 88.0%，PFR 68.2%，AF 1.98，WTSD 44.5% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 50.2%，PFR 41.2%，AF 1.97，WTSD 48.9% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 87.4%，PFR 45.4%，AF 1.87，WTSD 43.9% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 41.3%，PFR 17.1%，AF 1.72，WTSD 50.0% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 72.3%，PFR 35.4%，AF 1.82，WTSD 45.8% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 92.9%，PFR 63.1%，AF 1.92，WTSD 44.1% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 89.0%，PFR 8.6%，AF 1.71，WTSD 44.6% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 35.1%，PFR 29.6%，AF 1.95，WTSD 50.8% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 93.1%，PFR 50.6%，AF 1.88，WTSD 43.6% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 81.1%，PFR 68.7%，AF 2.06，WTSD 45.1% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 62.2%，PFR 37.6%，AF 1.84，WTSD 46.8% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 91.0%，PFR 35.0%，AF 1.81，WTSD 43.7% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 59.2%，PFR 57.1%，AF 2.17，WTSD 46.7% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 94.9%，PFR 37.9%，AF 1.82，WTSD 43.3% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 83.8%，PFR 54.5%，AF 1.92，WTSD 44.8% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 90.3%，PFR 78.1%，AF 2.07，WTSD 44.7% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 68.9%，PFR 17.9%，AF 1.76，WTSD 46.6% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 53.4%，PFR 26.8%，AF 1.77，WTSD 48.4% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 85.7%，PFR 31.9%，AF 1.80，WTSD 44.1% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 89.7%，PFR 22.3%，AF 1.77，WTSD 43.8% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 81.9%，PFR 41.2%，AF 1.85，WTSD 44.3% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 89.3%，PFR 59.3%，AF 1.91，WTSD 44.1% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 93.7%，PFR 64.1%，AF 1.94，WTSD 44.2% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 76.8%，PFR 27.7%，AF 1.80，WTSD 45.3% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 66.4%，PFR 54.6%，AF 2.03，WTSD 46.0% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 93.0%，PFR 73.2%，AF 1.99，WTSD 44.8% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 79.0%，PFR 49.9%，AF 1.89，WTSD 45.0% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 44.7%，PFR 28.0%，AF 1.82，WTSD 48.8% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 28.4%，PFR 9.2%，AF 1.63，WTSD 51.9% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 75.7%，PFR 63.2%，AF 2.03，WTSD 45.1% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 70.5%，PFR 43.4%，AF 1.87，WTSD 45.7% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 90.8%，PFR 71.0%，AF 2.00，WTSD 44.3% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 93.3%，PFR 23.7%，AF 1.77，WTSD 43.4% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 87.4%，PFR 75.2%，AF 2.06，WTSD 44.7% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 83.3%，PFR 63.3%，AF 1.97，WTSD 44.8% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 91.0%，PFR 48.7%，AF 1.86，WTSD 43.8% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 65.6%，PFR 32.0%，AF 1.80，WTSD 46.6% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 58.0%，PFR 47.4%，AF 2.00，WTSD 47.2% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 32.3%，PFR 21.2%，AF 1.76，WTSD 52.2% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 52.9%，PFR 15.1%，AF 1.71，WTSD 48.6% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 93.2%，PFR 36.5%，AF 1.82，WTSD 43.2% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 66.3%，PFR 47.8%，AF 1.92，WTSD 46.5% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 91.3%，PFR 61.9%，AF 1.95，WTSD 44.0% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 75.4%，PFR 18.9%，AF 1.77，WTSD 45.7% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 62.5%，PFR 23.2%，AF 1.76，WTSD 47.5% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 42.0%，PFR 35.0%，AF 1.94，WTSD 49.8% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 59.5%，PFR 29.2%，AF 1.78，WTSD 47.5% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 28.4%，PFR 24.2%，AF 2.00，WTSD 53.2% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 56.3%，PFR 34.2%，AF 1.83，WTSD 47.7% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 70.3%，PFR 25.6%，AF 1.78，WTSD 46.1% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 71.9%，PFR 59.7%，AF 2.01，WTSD 45.7% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 76.9%，PFR 57.2%，AF 1.96，WTSD 45.3% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 59.6%，PFR 42.7%，AF 1.89，WTSD 47.5% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '4-6p': {
      /** VPIP 36.3%，PFR 19.3%，AF 1.84，WTSD 45.0% */
      'gto': 'gto' as const,
      /** VPIP 84.7%，PFR 17.0%，AF 1.69，WTSD 34.9% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 9.6%，PFR 4.2%，AF 1.72，WTSD 53.6% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 68.9%，PFR 63.1%，AF 2.21，WTSD 47.6% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 43.1%，PFR 30.2%，AF 1.96，WTSD 44.1% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 55.8%，PFR 8.8%，AF 1.65，WTSD 40.5% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 80.1%，PFR 46.7%，AF 1.89，WTSD 39.4% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 32.3%，PFR 5.8%，AF 1.67，WTSD 45.9% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 61.7%，PFR 49.7%，AF 2.07，WTSD 43.6% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 24.6%，PFR 19.1%，AF 1.99，WTSD 48.2% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 63.0%，PFR 30.1%，AF 1.83，WTSD 40.0% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 20.1%，PFR 6.2%，AF 1.65，WTSD 49.9% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 43.0%，PFR 17.0%，AF 1.77，WTSD 43.2% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 72.3%，PFR 53.2%，AF 2.01，WTSD 42.5% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 67.2%，PFR 3.4%，AF 1.61，WTSD 37.8% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 15.3%，PFR 12.0%，AF 1.93，WTSD 52.3% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 75.1%，PFR 41.6%，AF 1.87，WTSD 39.4% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 51.4%，PFR 43.7%，AF 2.15，WTSD 44.4% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 33.6%，PFR 17.7%，AF 1.84，WTSD 45.5% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 71.6%，PFR 23.2%，AF 1.76，WTSD 37.5% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 30.1%，PFR 28.7%，AF 2.25，WTSD 47.9% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 82.4%，PFR 30.1%，AF 1.76，WTSD 36.4% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 56.0%，PFR 35.4%，AF 1.91，WTSD 41.5% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 64.6%，PFR 58.3%，AF 2.18，WTSD 46.2% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 40.5%，PFR 6.8%，AF 1.66，WTSD 43.8% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 27.6%，PFR 11.1%，AF 1.76，WTSD 47.0% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 61.5%，PFR 17.4%，AF 1.71，WTSD 39.3% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 69.7%，PFR 11.6%，AF 1.66，WTSD 37.6% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 54.8%，PFR 23.7%，AF 1.81，WTSD 41.0% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 64.9%，PFR 44.4%，AF 1.97，WTSD 41.7% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 74.4%，PFR 55.6%，AF 2.01，WTSD 43.1% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 48.8%，PFR 12.8%，AF 1.72，WTSD 41.8% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 36.8%，PFR 29.2%，AF 2.03，WTSD 45.3% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 70.6%，PFR 60.2%，AF 2.13，WTSD 45.9% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 49.9%，PFR 29.4%，AF 1.90，WTSD 42.8% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 21.4%，PFR 11.6%，AF 1.77，WTSD 49.0% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 13.7%，PFR 3.3%，AF 1.62，WTSD 50.6% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 45.1%，PFR 37.0%，AF 2.10，WTSD 44.6% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 40.8%，PFR 22.3%，AF 1.87，WTSD 43.6% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 66.3%，PFR 55.2%，AF 2.09，WTSD 44.4% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 78.2%，PFR 14.1%，AF 1.68，WTSD 35.9% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 59.9%，PFR 53.0%，AF 2.17，WTSD 45.2% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 54.8%，PFR 41.9%，AF 2.05，WTSD 43.1% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 70.2%，PFR 36.6%，AF 1.84，WTSD 39.2% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 36.9%，PFR 14.4%，AF 1.77，WTSD 44.6% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 29.5%，PFR 22.8%，AF 1.99，WTSD 47.0% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 14.2%，PFR 8.0%，AF 1.77，WTSD 52.1% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 27.8%，PFR 5.3%，AF 1.64，WTSD 47.2% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 77.4%，PFR 26.5%，AF 1.76，WTSD 36.7% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 36.7%，PFR 24.6%，AF 1.92，WTSD 45.6% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 68.8%，PFR 49.3%，AF 2.03，WTSD 41.5% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 47.7%，PFR 7.6%，AF 1.66，WTSD 42.1% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 34.6%，PFR 9.2%，AF 1.71，WTSD 44.8% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 19.1%，PFR 15.0%，AF 1.97，WTSD 50.2% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 31.8%，PFR 12.5%，AF 1.74，WTSD 45.9% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 12.2%，PFR 9.6%，AF 2.02，WTSD 53.2% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 28.9%，PFR 15.1%，AF 1.79，WTSD 46.8% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 41.6%，PFR 10.9%，AF 1.71，WTSD 43.7% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 41.3%，PFR 33.3%，AF 2.07，WTSD 44.9% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 46.9%，PFR 33.6%，AF 1.99，WTSD 43.7% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 31.2%，PFR 20.5%，AF 1.90，WTSD 46.6% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '7-9p': {
      /** VPIP 24.4%，PFR 11.8%，AF 1.80，WTSD 45.4% */
      'gto': 'gto' as const,
      /** VPIP 77.6%，PFR 13.4%，AF 1.64，WTSD 32.9% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 6.6%，PFR 2.7%，AF 1.55，WTSD 51.2% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 50.7%，PFR 47.3%，AF 2.23，WTSD 54.6% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 30.0%，PFR 20.6%，AF 1.99，WTSD 45.1% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 42.8%，PFR 4.9%，AF 1.62，WTSD 38.1% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 65.8%，PFR 39.6%，AF 1.90，WTSD 42.5% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 21.5%，PFR 2.9%，AF 1.63，WTSD 44.9% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 46.2%，PFR 38.0%，AF 2.12，WTSD 46.5% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 15.2%，PFR 11.6%，AF 1.94，WTSD 50.2% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 49.8%，PFR 22.2%，AF 1.83，WTSD 38.7% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 12.8%，PFR 3.4%，AF 1.59，WTSD 48.1% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 30.6%，PFR 10.3%，AF 1.74，WTSD 42.6% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 56.0%，PFR 42.4%，AF 2.04，WTSD 47.9% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 54.8%，PFR 1.8%，AF 1.55，WTSD 35.4% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 9.7%，PFR 7.4%，AF 1.86，WTSD 52.1% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 61.5%，PFR 34.3%，AF 1.86，WTSD 40.1% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 37.2%，PFR 31.9%，AF 2.16，WTSD 47.0% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 22.2%，PFR 10.7%，AF 1.78，WTSD 46.0% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 60.0%，PFR 17.4%，AF 1.73，WTSD 35.5% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 19.3%，PFR 18.3%，AF 2.28，WTSD 50.3% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 72.7%，PFR 25.5%，AF 1.73，WTSD 35.2% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 42.3%，PFR 26.2%，AF 1.98，WTSD 42.2% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 47.6%，PFR 43.7%，AF 2.18，WTSD 51.2% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 28.5%，PFR 3.4%，AF 1.63，WTSD 42.7% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 17.5%，PFR 6.2%，AF 1.62，WTSD 47.4% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 48.8%，PFR 11.5%，AF 1.68，WTSD 37.5% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 58.0%，PFR 7.5%，AF 1.62，WTSD 35.3% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 41.5%，PFR 16.1%，AF 1.78，WTSD 39.8% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 50.1%，PFR 34.6%，AF 1.98，WTSD 43.8% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 57.4%，PFR 44.4%，AF 2.08，WTSD 49.4% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 36.0%，PFR 7.3%，AF 1.67，WTSD 40.4% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 24.4%，PFR 19.1%，AF 2.04，WTSD 47.9% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 52.7%，PFR 46.2%，AF 2.16，WTSD 53.1% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 36.5%，PFR 20.5%，AF 1.90，WTSD 42.5% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 13.2%，PFR 6.7%，AF 1.70，WTSD 49.4% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 9.1%，PFR 1.9%，AF 1.54，WTSD 49.4% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 31.6%，PFR 26.1%，AF 2.11，WTSD 46.7% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 28.4%，PFR 14.3%，AF 1.84，WTSD 43.9% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 49.8%，PFR 42.5%，AF 2.16，WTSD 49.2% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 68.8%，PFR 10.4%，AF 1.62，WTSD 33.8% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 44.2%，PFR 39.8%，AF 2.22，WTSD 48.8% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 40.4%，PFR 31.1%，AF 2.07，WTSD 44.9% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 56.9%，PFR 29.0%，AF 1.84，WTSD 39.1% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 25.1%，PFR 8.3%，AF 1.71，WTSD 44.4% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 18.7%，PFR 14.3%，AF 1.97，WTSD 48.7% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 9.1%，PFR 4.9%，AF 1.61，WTSD 51.8% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 17.9%，PFR 2.7%，AF 1.62，WTSD 46.0% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 66.8%，PFR 21.3%，AF 1.71，WTSD 35.3% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 24.4%，PFR 15.8%，AF 1.90，WTSD 46.2% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 53.4%，PFR 39.0%，AF 2.05，WTSD 45.1% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 34.7%，PFR 3.9%，AF 1.61，WTSD 40.8% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 23.5%，PFR 5.0%，AF 1.65，WTSD 44.5% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 11.7%，PFR 9.0%，AF 1.85，WTSD 51.5% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 21.0%，PFR 7.0%，AF 1.69，WTSD 45.9% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 8.0%，PFR 5.9%，AF 1.81，WTSD 52.9% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 18.4%，PFR 8.9%，AF 1.75，WTSD 47.0% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 29.3%，PFR 5.9%，AF 1.66，WTSD 42.5% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 28.3%，PFR 22.8%，AF 2.09，WTSD 46.7% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 33.4%，PFR 23.7%，AF 2.01，WTSD 44.9% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 20.1%，PFR 12.7%，AF 1.85，WTSD 47.5% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
  },
  '2-50': {
    '2-3p': {
      /** VPIP 70.8%，PFR 42.0%，AF 1.89，WTSD 45.7% */
      'gto': 'gto' as const,
      /** VPIP 96.1%，PFR 24.4%，AF 1.85，WTSD 40.4% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 28.6%，PFR 15.6%，AF 1.75，WTSD 53.8% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 92.5%，PFR 79.6%，AF 2.07，WTSD 46.8% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 77.0%，PFR 55.9%，AF 2.00，WTSD 46.1% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 86.4%，PFR 20.7%，AF 1.75，WTSD 42.8% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 95.3%，PFR 50.0%，AF 1.84，WTSD 43.5% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 66.5%，PFR 18.0%，AF 1.73，WTSD 45.9% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 88.9%，PFR 67.9%，AF 1.97，WTSD 46.0% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 56.1%，PFR 45.8%，AF 2.10，WTSD 48.5% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 89.7%，PFR 44.1%，AF 1.87，WTSD 42.9% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 49.6%，PFR 20.1%，AF 1.73，WTSD 47.9% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 77.5%，PFR 36.0%，AF 1.83，WTSD 45.4% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 93.4%，PFR 61.4%，AF 1.97，WTSD 44.0% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 92.3%，PFR 9.5%，AF 1.71，WTSD 41.3% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 41.9%，PFR 34.8%，AF 1.93，WTSD 53.6% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 94.1%，PFR 48.2%，AF 1.85，WTSD 43.0% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 83.0%，PFR 70.2%，AF 2.11，WTSD 46.6% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 68.1%，PFR 40.1%，AF 1.85，WTSD 47.2% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 93.2%，PFR 34.8%，AF 1.78，WTSD 41.9% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 64.3%，PFR 61.9%，AF 2.22，WTSD 48.2% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 95.6%，PFR 36.4%，AF 1.79，WTSD 42.3% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 86.9%，PFR 54.9%，AF 1.91，WTSD 44.7% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 90.6%，PFR 77.8%，AF 2.04，WTSD 46.5% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 75.3%，PFR 19.4%，AF 1.77，WTSD 44.5% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 60.0%，PFR 28.9%，AF 1.85，WTSD 45.1% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 89.2%，PFR 31.6%，AF 1.78，WTSD 43.5% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 92.5%，PFR 22.8%，AF 1.77，WTSD 41.7% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 85.5%，PFR 41.2%，AF 1.84，WTSD 43.6% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 90.8%，PFR 58.7%，AF 1.91，WTSD 43.7% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 94.2%，PFR 62.1%，AF 1.89，WTSD 45.0% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 81.8%，PFR 28.7%，AF 1.79，WTSD 44.1% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 72.2%，PFR 59.5%，AF 2.05，WTSD 47.2% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 92.8%，PFR 72.3%，AF 1.98，WTSD 46.1% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 82.6%，PFR 51.0%，AF 1.88，WTSD 44.7% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 53.0%，PFR 32.6%，AF 1.85，WTSD 48.0% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 38.1%，PFR 12.4%，AF 1.69，WTSD 50.4% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 78.7%，PFR 65.6%，AF 2.06，WTSD 47.0% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 75.7%，PFR 45.3%，AF 1.91，WTSD 44.7% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 91.3%，PFR 70.2%，AF 1.98，WTSD 45.8% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 94.8%，PFR 23.3%，AF 1.77，WTSD 41.4% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 88.1%，PFR 75.0%，AF 2.06，WTSD 46.4% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 85.6%，PFR 64.0%，AF 1.96，WTSD 46.0% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 92.6%，PFR 47.1%，AF 1.86，WTSD 43.1% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 72.0%，PFR 34.0%，AF 1.84，WTSD 45.1% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 63.3%，PFR 51.3%，AF 2.00，WTSD 48.4% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 40.2%，PFR 25.4%，AF 1.79，WTSD 52.3% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 60.2%，PFR 17.0%，AF 1.73，WTSD 46.7% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 94.7%，PFR 34.5%，AF 1.80，WTSD 41.9% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 71.3%，PFR 50.6%，AF 1.99，WTSD 47.6% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 92.6%，PFR 60.7%，AF 1.95，WTSD 42.9% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 81.3%，PFR 20.3%，AF 1.75，WTSD 43.8% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 69.3%，PFR 26.4%，AF 1.84，WTSD 43.9% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 48.4%，PFR 39.7%，AF 1.94，WTSD 51.2% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 65.9%，PFR 31.1%，AF 1.77，WTSD 47.4% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 35.1%，PFR 29.4%，AF 1.98，WTSD 55.5% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 62.4%，PFR 37.1%，AF 1.83，WTSD 47.8% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 76.2%，PFR 27.0%，AF 1.78，WTSD 44.6% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 75.8%，PFR 62.3%，AF 2.05，WTSD 47.6% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 80.0%，PFR 58.6%，AF 1.97，WTSD 46.3% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 65.5%，PFR 46.1%，AF 1.93，WTSD 47.4% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '4-6p': {
      /** VPIP 43.7%，PFR 21.2%，AF 1.80，WTSD 43.9% */
      'gto': 'gto' as const,
      /** VPIP 88.4%，PFR 13.6%，AF 1.68，WTSD 32.8% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 14.3%，PFR 6.0%，AF 1.67，WTSD 50.4% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 70.2%，PFR 61.9%，AF 2.10，WTSD 51.0% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 48.3%，PFR 32.0%，AF 1.94，WTSD 44.1% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 65.7%，PFR 8.4%，AF 1.62，WTSD 36.4% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 85.1%，PFR 38.7%，AF 1.79，WTSD 39.0% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 41.6%，PFR 6.5%，AF 1.61，WTSD 41.5% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 64.2%，PFR 47.7%，AF 1.99，WTSD 45.4% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 30.8%，PFR 23.7%，AF 1.94，WTSD 50.1% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 69.5%，PFR 26.0%，AF 1.78，WTSD 38.3% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 27.6%，PFR 7.9%，AF 1.70，WTSD 46.3% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 51.7%，PFR 17.3%，AF 1.72，WTSD 40.3% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 75.8%，PFR 47.9%，AF 1.88，WTSD 42.6% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 76.2%，PFR 3.4%，AF 1.54，WTSD 34.5% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 20.7%，PFR 16.6%，AF 1.95，WTSD 52.4% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 80.1%，PFR 34.6%，AF 1.81，WTSD 37.7% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 54.4%，PFR 45.0%，AF 1.98，WTSD 46.8% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 40.8%，PFR 19.9%，AF 1.79，WTSD 44.1% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 78.0%，PFR 18.7%，AF 1.68，WTSD 35.4% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 35.4%，PFR 33.7%，AF 2.21，WTSD 50.5% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 87.1%，PFR 23.1%，AF 1.68，WTSD 35.7% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 61.6%，PFR 33.8%，AF 1.96，WTSD 41.1% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 65.7%，PFR 57.2%，AF 2.11，WTSD 48.0% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 50.8%，PFR 7.3%，AF 1.61，WTSD 39.4% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 35.5%，PFR 13.3%，AF 1.85，WTSD 43.3% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 69.9%，PFR 15.4%，AF 1.68，WTSD 37.2% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 77.4%，PFR 9.9%，AF 1.61，WTSD 35.1% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 62.1%，PFR 21.9%，AF 1.74，WTSD 38.8% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 69.3%，PFR 40.6%，AF 1.91，WTSD 41.7% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 78.5%，PFR 50.1%，AF 1.88，WTSD 43.4% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 58.4%，PFR 12.6%，AF 1.65，WTSD 38.6% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 42.4%，PFR 33.0%，AF 2.01，WTSD 48.0% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 72.8%，PFR 57.5%，AF 2.00，WTSD 46.8% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 56.0%，PFR 28.9%，AF 1.86，WTSD 41.2% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 28.7%，PFR 14.8%，AF 1.83，WTSD 45.3% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 20.6%，PFR 4.4%，AF 1.66，WTSD 46.6% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 48.8%，PFR 39.0%，AF 2.01，WTSD 46.4% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 47.9%，PFR 23.8%，AF 1.84，WTSD 42.8% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 68.5%，PFR 52.6%，AF 2.01，WTSD 44.8% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 83.9%，PFR 11.5%，AF 1.63，WTSD 34.3% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 61.4%，PFR 52.3%，AF 2.09，WTSD 47.0% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 58.3%，PFR 41.4%，AF 1.96，WTSD 44.3% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 75.5%，PFR 30.4%，AF 1.75，WTSD 38.2% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 45.5%，PFR 15.1%，AF 1.70，WTSD 41.7% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 35.5%，PFR 27.1%，AF 2.00，WTSD 47.6% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 20.5%，PFR 11.2%，AF 1.73，WTSD 49.5% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 37.0%，PFR 6.3%，AF 1.66，WTSD 42.3% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 82.9%，PFR 20.9%，AF 1.66，WTSD 35.5% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 42.5%，PFR 27.3%，AF 1.90，WTSD 44.8% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 72.6%，PFR 44.3%，AF 1.87，WTSD 41.3% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 58.0%，PFR 7.6%，AF 1.59，WTSD 38.2% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 44.0%，PFR 10.5%，AF 1.73，WTSD 41.6% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 24.9%，PFR 19.5%，AF 2.05，WTSD 50.1% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 40.0%，PFR 13.9%，AF 1.71，WTSD 42.8% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 17.3%，PFR 13.8%，AF 1.97，WTSD 54.7% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 36.1%，PFR 17.8%，AF 1.75，WTSD 45.4% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 51.0%，PFR 11.2%，AF 1.68，WTSD 39.3% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 46.0%，PFR 36.3%，AF 2.04，WTSD 46.9% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 51.8%，PFR 34.6%，AF 1.93，WTSD 44.3% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 37.7%，PFR 24.0%，AF 1.90，WTSD 46.2% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '7-9p': {
      /** VPIP 32.1%，PFR 13.2%，AF 1.73，WTSD 44.9% */
      'gto': 'gto' as const,
      /** VPIP 84.4%，PFR 9.5%，AF 1.55，WTSD 31.6% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 10.8%，PFR 4.1%，AF 1.50，WTSD 51.1% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 53.4%，PFR 46.4%，AF 2.08，WTSD 63.4% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 35.5%，PFR 21.2%，AF 1.89，WTSD 47.5% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 55.1%，PFR 4.9%，AF 1.53，WTSD 35.5% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 75.7%，PFR 31.8%，AF 1.71，WTSD 41.7% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 31.1%，PFR 3.7%，AF 1.56，WTSD 41.1% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 49.8%，PFR 35.1%，AF 1.96，WTSD 51.5% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 20.7%，PFR 15.5%，AF 2.07，WTSD 49.9% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 58.7%，PFR 17.8%，AF 1.65，WTSD 39.3% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 20.3%，PFR 4.7%，AF 1.61，WTSD 45.2% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 40.4%，PFR 10.4%，AF 1.62，WTSD 41.3% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 62.8%，PFR 37.3%，AF 1.87，WTSD 48.8% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 66.8%，PFR 2.1%，AF 1.47，WTSD 32.2% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 14.6%，PFR 11.1%，AF 1.95，WTSD 56.1% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 70.1%，PFR 27.0%，AF 1.73，WTSD 40.1% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 40.1%，PFR 31.8%，AF 2.02，WTSD 51.8% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 29.7%，PFR 12.3%，AF 1.74，WTSD 46.2% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 70.3%，PFR 13.0%，AF 1.56，WTSD 35.2% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 23.7%，PFR 22.4%，AF 2.34，WTSD 55.5% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 80.5%，PFR 17.8%，AF 1.62，WTSD 34.7% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 49.2%，PFR 23.3%，AF 1.86，WTSD 40.8% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 49.7%，PFR 42.3%，AF 2.06，WTSD 58.3% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 39.8%，PFR 4.1%，AF 1.54，WTSD 39.2% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 25.3%，PFR 8.0%，AF 1.74，WTSD 45.1% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 59.5%，PFR 9.6%，AF 1.55，WTSD 35.9% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 68.5%，PFR 6.2%，AF 1.52，WTSD 34.0% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 51.0%，PFR 13.9%，AF 1.65，WTSD 39.7% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 56.1%，PFR 29.8%，AF 1.82，WTSD 44.2% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 64.9%，PFR 40.2%，AF 1.87，WTSD 51.1% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 47.0%，PFR 7.2%，AF 1.57，WTSD 38.1% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 29.3%，PFR 21.5%，AF 2.09，WTSD 50.5% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 57.2%，PFR 44.1%，AF 2.03，WTSD 59.1% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 43.8%，PFR 19.2%，AF 1.78，WTSD 43.6% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 19.8%，PFR 9.2%，AF 1.67，WTSD 47.2% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 15.3%，PFR 2.6%，AF 1.57，WTSD 45.1% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 35.3%，PFR 27.0%，AF 2.07，WTSD 51.7% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 35.8%，PFR 15.2%，AF 1.81，WTSD 43.4% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 53.6%，PFR 39.3%，AF 2.02，WTSD 54.2% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 77.4%，PFR 7.9%，AF 1.52，WTSD 33.0% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 46.0%，PFR 38.1%，AF 2.10，WTSD 54.5% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 44.5%，PFR 29.2%，AF 1.97，WTSD 48.7% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 64.8%，PFR 22.7%，AF 1.68，WTSD 39.8% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 34.3%，PFR 9.1%，AF 1.63，WTSD 43.0% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 24.3%，PFR 17.8%，AF 2.00，WTSD 52.2% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 14.5%，PFR 7.4%，AF 1.69，WTSD 51.3% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 26.8%，PFR 3.5%，AF 1.56，WTSD 42.0% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 75.2%，PFR 15.4%，AF 1.60，WTSD 35.0% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 30.8%，PFR 17.9%，AF 1.85，WTSD 48.8% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 59.7%，PFR 34.0%，AF 1.91，WTSD 45.7% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 46.6%，PFR 4.3%，AF 1.51，WTSD 37.5% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 33.3%，PFR 5.6%，AF 1.60，WTSD 39.2% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 17.1%，PFR 12.8%，AF 1.92，WTSD 54.6% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 29.6%，PFR 8.3%，AF 1.64，WTSD 44.4% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 12.4%，PFR 9.4%，AF 1.87，WTSD 56.4% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 25.7%，PFR 11.2%，AF 1.72，WTSD 47.5% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 40.1%，PFR 6.3%，AF 1.58，WTSD 39.6% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 32.7%，PFR 24.6%，AF 2.10，WTSD 51.0% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 38.5%，PFR 23.6%，AF 1.90，WTSD 48.0% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 26.5%，PFR 15.4%，AF 1.89，WTSD 49.4% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
  },
  '2-100': {
    '2-3p': {
      /** VPIP 77.0%，PFR 41.5%，AF 1.86，WTSD 45.1% */
      'gto': 'gto' as const,
      /** VPIP 97.4%，PFR 20.9%，AF 1.74，WTSD 40.7% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 35.4%，PFR 17.3%，AF 1.73，WTSD 51.8% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 93.7%，PFR 78.7%，AF 2.03，WTSD 47.5% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 81.7%，PFR 56.1%，AF 1.94，WTSD 46.1% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 91.4%，PFR 18.4%，AF 1.73，WTSD 41.7% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 96.9%，PFR 43.7%，AF 1.81，WTSD 42.5% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 75.5%，PFR 16.6%，AF 1.74，WTSD 44.1% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 91.3%，PFR 66.0%，AF 1.95，WTSD 45.1% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 62.6%，PFR 49.8%，AF 2.00，WTSD 49.3% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 92.9%，PFR 39.8%，AF 1.80，WTSD 42.5% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 58.0%，PFR 19.9%，AF 1.74，WTSD 46.7% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 83.9%，PFR 34.3%，AF 1.81，WTSD 43.6% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 95.2%，PFR 56.7%，AF 1.88，WTSD 43.5% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 94.8%，PFR 8.3%，AF 1.70，WTSD 41.0% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 47.9%，PFR 38.8%，AF 1.95，WTSD 52.8% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 96.0%，PFR 42.6%，AF 1.81，WTSD 42.1% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 85.8%，PFR 70.6%，AF 2.05，WTSD 46.4% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 74.6%，PFR 40.3%，AF 1.87，WTSD 45.4% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 95.3%，PFR 29.2%，AF 1.78，WTSD 41.2% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 68.7%，PFR 65.6%，AF 2.18，WTSD 50.4% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 97.1%，PFR 30.5%，AF 1.76，WTSD 41.5% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 89.9%，PFR 51.5%，AF 1.87，WTSD 43.9% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 91.9%，PFR 77.0%，AF 2.03，WTSD 47.0% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 83.4%，PFR 17.4%，AF 1.73，WTSD 42.9% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 68.3%，PFR 29.1%，AF 1.79，WTSD 45.4% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 92.8%，PFR 27.5%，AF 1.77，WTSD 41.7% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 95.0%，PFR 19.1%，AF 1.73，WTSD 41.0% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 90.0%，PFR 37.6%，AF 1.81，WTSD 42.8% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 93.0%，PFR 54.2%，AF 1.88，WTSD 43.7% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 95.7%，PFR 57.4%，AF 1.88，WTSD 44.0% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 87.9%，PFR 25.7%，AF 1.76，WTSD 42.5% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 75.5%，PFR 60.4%，AF 2.01，WTSD 47.9% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 94.4%，PFR 69.3%，AF 1.94，WTSD 45.4% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 86.9%，PFR 48.4%，AF 1.88，WTSD 44.0% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 59.0%，PFR 33.5%，AF 1.82，WTSD 47.9% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 46.7%，PFR 12.2%，AF 1.68，WTSD 47.9% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 82.3%，PFR 66.8%，AF 2.01，WTSD 47.2% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 81.1%，PFR 44.3%，AF 1.90，WTSD 44.3% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 93.1%，PFR 68.0%，AF 1.96，WTSD 44.9% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 96.5%，PFR 19.9%，AF 1.73，WTSD 40.8% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 90.0%，PFR 74.9%，AF 2.02，WTSD 46.9% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 88.3%，PFR 62.7%，AF 1.96，WTSD 45.4% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 94.8%，PFR 41.6%，AF 1.82，WTSD 42.2% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 79.0%，PFR 32.5%，AF 1.81，WTSD 44.3% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 68.8%，PFR 54.4%，AF 1.99，WTSD 48.5% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 46.9%，PFR 27.8%，AF 1.79，WTSD 50.6% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 69.7%，PFR 16.1%，AF 1.71，WTSD 44.8% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 96.3%，PFR 29.9%，AF 1.77，WTSD 41.3% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 76.4%，PFR 51.8%，AF 1.93，WTSD 46.6% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 94.1%，PFR 55.9%，AF 1.89，WTSD 43.2% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 88.0%，PFR 18.0%，AF 1.73，WTSD 42.1% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 77.8%，PFR 24.0%，AF 1.79，WTSD 43.6% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 54.5%，PFR 43.6%，AF 1.95，WTSD 51.2% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 73.8%，PFR 30.7%，AF 1.79，WTSD 45.3% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 40.9%，PFR 33.5%，AF 1.97，WTSD 54.9% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 69.4%，PFR 37.6%，AF 1.84，WTSD 46.5% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 83.5%，PFR 24.7%，AF 1.78，WTSD 43.0% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 79.6%，PFR 64.1%，AF 2.04，WTSD 47.2% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 84.2%，PFR 58.7%，AF 1.95，WTSD 45.6% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 71.2%，PFR 47.9%，AF 1.91，WTSD 47.3% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '4-6p': {
      /** VPIP 52.5%，PFR 20.2%，AF 1.72，WTSD 43.0% */
      'gto': 'gto' as const,
      /** VPIP 92.4%，PFR 10.2%，AF 1.54，WTSD 33.1% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 20.2%，PFR 7.3%，AF 1.67，WTSD 48.6% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 74.1%，PFR 60.1%，AF 2.01，WTSD 53.3% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 55.4%，PFR 30.9%，AF 1.86，WTSD 44.7% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 75.8%，PFR 7.3%，AF 1.52，WTSD 35.3% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 90.5%，PFR 29.9%，AF 1.66，WTSD 37.8% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 52.8%，PFR 6.2%，AF 1.55，WTSD 39.7% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 69.8%，PFR 43.5%，AF 1.87，WTSD 44.9% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 36.2%，PFR 26.3%，AF 1.99，WTSD 50.5% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 77.9%，PFR 20.8%，AF 1.63，WTSD 37.3% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 36.6%，PFR 7.8%，AF 1.62，WTSD 44.1% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 62.3%，PFR 15.2%，AF 1.61，WTSD 39.3% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 82.3%，PFR 39.8%，AF 1.74，WTSD 41.1% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 83.8%，PFR 3.5%，AF 1.49，WTSD 33.3% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 26.1%，PFR 19.9%，AF 1.96，WTSD 53.4% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 86.3%，PFR 26.2%，AF 1.65，WTSD 36.7% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 58.4%，PFR 43.9%，AF 2.02，WTSD 47.9% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 49.7%，PFR 19.3%，AF 1.72，WTSD 43.3% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 85.0%，PFR 14.3%，AF 1.59，WTSD 34.5% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 39.2%，PFR 36.9%，AF 2.26，WTSD 53.5% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 91.5%，PFR 17.0%，AF 1.58，WTSD 34.6% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 69.3%，PFR 29.2%，AF 1.74，WTSD 40.5% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 69.0%，PFR 54.8%，AF 2.00，WTSD 50.5% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 62.4%，PFR 6.6%，AF 1.54，WTSD 37.3% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 44.7%，PFR 12.6%，AF 1.67，WTSD 42.7% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 78.9%，PFR 12.3%，AF 1.55，WTSD 35.7% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 84.6%，PFR 8.2%，AF 1.53，WTSD 34.1% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 72.0%，PFR 18.2%，AF 1.62，WTSD 37.8% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 76.0%，PFR 34.1%，AF 1.74，WTSD 40.6% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 84.9%，PFR 42.1%，AF 1.75，WTSD 42.1% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 69.3%，PFR 10.6%，AF 1.57，WTSD 36.9% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 47.2%，PFR 33.8%，AF 2.01，WTSD 48.9% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 78.2%，PFR 52.4%，AF 1.87，WTSD 47.5% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 64.8%，PFR 25.6%，AF 1.73，WTSD 40.8% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 35.5%，PFR 15.8%，AF 1.76，WTSD 46.4% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 28.6%，PFR 4.7%，AF 1.60，WTSD 44.5% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 53.8%，PFR 39.3%，AF 2.00，WTSD 48.2% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 57.1%，PFR 21.9%，AF 1.75，WTSD 41.8% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 73.6%，PFR 47.7%，AF 1.87，WTSD 45.7% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 89.3%，PFR 9.1%，AF 1.53，WTSD 33.5% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 65.0%，PFR 50.4%，AF 2.00，WTSD 49.0% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 64.5%，PFR 38.2%，AF 1.86，WTSD 44.3% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 82.8%，PFR 23.8%，AF 1.64，WTSD 37.1% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 56.0%，PFR 14.1%，AF 1.63，WTSD 40.5% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 41.0%，PFR 29.2%，AF 1.98，WTSD 48.9% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 26.8%，PFR 12.8%，AF 1.73，WTSD 49.1% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 46.8%，PFR 6.0%，AF 1.56，WTSD 40.6% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 88.5%，PFR 15.6%，AF 1.57，WTSD 34.8% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 49.8%，PFR 27.3%，AF 1.84，WTSD 45.2% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 79.2%，PFR 37.4%，AF 1.74，WTSD 41.1% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 69.2%，PFR 6.8%，AF 1.52，WTSD 36.1% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 55.0%，PFR 9.5%，AF 1.57，WTSD 39.6% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 30.3%，PFR 22.6%，AF 2.00，WTSD 51.9% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 50.1%，PFR 13.2%，AF 1.65，WTSD 41.8% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 22.1%，PFR 16.9%，AF 1.98，WTSD 54.5% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 44.5%，PFR 17.9%，AF 1.72，WTSD 44.6% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 62.7%，PFR 9.8%，AF 1.57，WTSD 38.3% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 51.0%，PFR 36.8%，AF 2.02，WTSD 47.8% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 58.5%，PFR 33.2%，AF 1.84，WTSD 44.5% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 44.6%，PFR 24.6%，AF 1.84，WTSD 46.3% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '7-9p': {
      /** VPIP 41.4%，PFR 12.8%，AF 1.60，WTSD 42.8% */
      'gto': 'gto' as const,
      /** VPIP 89.0%，PFR 7.8%，AF 1.40，WTSD 30.1% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 15.3%，PFR 5.1%，AF 1.52，WTSD 48.9% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 58.0%，PFR 45.3%，AF 2.00，WTSD 64.7% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 43.1%，PFR 20.6%，AF 1.76，WTSD 46.5% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 66.2%，PFR 4.9%，AF 1.38，WTSD 32.7% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 84.3%，PFR 24.2%，AF 1.54，WTSD 36.9% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 41.5%，PFR 4.0%，AF 1.40，WTSD 38.1% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 56.5%，PFR 31.8%，AF 1.79，WTSD 48.7% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 25.8%，PFR 17.4%，AF 2.01，WTSD 55.0% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 68.8%，PFR 14.6%，AF 1.50，WTSD 35.7% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 27.7%，PFR 5.2%，AF 1.47，WTSD 43.6% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 51.3%，PFR 9.7%，AF 1.49，WTSD 38.1% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 71.7%，PFR 31.1%，AF 1.65，WTSD 43.1% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 76.4%，PFR 2.4%，AF 1.34，WTSD 29.5% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 18.5%，PFR 13.3%，AF 1.96，WTSD 57.1% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 79.0%，PFR 20.3%，AF 1.52，WTSD 35.8% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 44.6%，PFR 30.9%，AF 2.00，WTSD 53.5% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 38.6%，PFR 12.2%，AF 1.61，WTSD 43.4% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 78.3%，PFR 10.5%，AF 1.46，WTSD 32.5% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 26.8%，PFR 24.9%，AF 2.31，WTSD 59.6% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 87.1%，PFR 13.2%，AF 1.45，WTSD 32.0% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 58.1%，PFR 20.1%，AF 1.63，WTSD 41.0% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 53.7%，PFR 40.4%，AF 1.96，WTSD 59.2% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 51.1%，PFR 4.3%，AF 1.39，WTSD 35.5% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 34.3%，PFR 7.9%，AF 1.54，WTSD 43.1% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 70.3%，PFR 8.4%，AF 1.42，WTSD 33.2% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 77.8%，PFR 5.8%，AF 1.38，WTSD 31.0% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 61.8%，PFR 12.0%，AF 1.49，WTSD 36.4% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 65.2%，PFR 24.9%，AF 1.63，WTSD 41.0% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 74.3%，PFR 33.8%，AF 1.65，WTSD 44.7% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 58.7%，PFR 6.8%，AF 1.42，WTSD 35.1% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 34.6%，PFR 22.5%，AF 1.99，WTSD 52.4% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 64.3%，PFR 40.5%，AF 1.84，WTSD 54.7% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 53.3%，PFR 16.9%，AF 1.59，WTSD 40.6% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 26.5%，PFR 10.2%，AF 1.68，WTSD 47.5% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 21.8%，PFR 3.2%，AF 1.45，WTSD 43.7% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 40.6%，PFR 27.0%，AF 1.95，WTSD 52.5% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 45.7%，PFR 14.2%，AF 1.60，WTSD 42.2% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 60.3%，PFR 35.8%，AF 1.81，WTSD 51.0% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 84.5%，PFR 6.6%，AF 1.39，WTSD 30.0% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 50.4%，PFR 36.6%，AF 1.95，WTSD 56.4% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 51.5%，PFR 26.8%，AF 1.79，WTSD 46.9% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 74.7%，PFR 17.6%，AF 1.52，WTSD 35.3% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 44.9%，PFR 8.8%，AF 1.50，WTSD 39.5% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 29.7%，PFR 19.3%，AF 1.96，WTSD 53.2% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 19.7%，PFR 8.5%，AF 1.65，WTSD 50.1% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 36.1%，PFR 3.9%，AF 1.42，WTSD 39.5% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 83.1%，PFR 11.8%，AF 1.45，WTSD 32.2% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 38.1%，PFR 17.9%，AF 1.76，WTSD 47.2% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 68.1%，PFR 28.3%，AF 1.66，WTSD 42.4% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 58.3%，PFR 4.5%，AF 1.38，WTSD 34.0% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 44.0%，PFR 6.0%，AF 1.47，WTSD 38.2% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 21.5%，PFR 15.0%，AF 1.99，WTSD 56.1% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 39.1%，PFR 8.3%，AF 1.50，WTSD 41.4% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 16.0%，PFR 11.6%，AF 1.92，WTSD 57.2% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 33.8%，PFR 11.3%，AF 1.62，WTSD 45.3% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 51.5%，PFR 6.2%，AF 1.43，WTSD 36.5% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 38.1%，PFR 24.9%，AF 1.96，WTSD 52.2% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 46.0%，PFR 22.4%，AF 1.78，WTSD 46.5% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 33.4%，PFR 16.0%，AF 1.76，WTSD 48.3% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
  },
  '3-0': {
    '2-3p': {},
    '4-6p': {
      /** VPIP 36.3%，PFR 18.3%，AF 1.86，WTSD 48.6% */
      'gto': 'gto' as const,
      /** VPIP 79.8%，PFR 18.4%，AF 1.74，WTSD 37.0% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 13.4%，PFR 5.5%，AF 1.89，WTSD 56.7% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 68.5%，PFR 62.4%，AF 2.16，WTSD 54.9% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 41.6%，PFR 27.8%，AF 1.95，WTSD 48.7% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 52.5%，PFR 9.5%，AF 1.71，WTSD 42.1% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 77.6%，PFR 48.2%，AF 1.91，WTSD 45.0% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 33.5%，PFR 6.5%，AF 1.72，WTSD 47.3% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 58.9%，PFR 46.9%，AF 2.03，WTSD 48.5% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 26.4%，PFR 19.5%，AF 1.98，WTSD 54.4% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 59.0%，PFR 28.5%，AF 1.86，WTSD 43.1% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 23.8%，PFR 7.0%，AF 1.80，WTSD 51.2% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 42.0%，PFR 16.3%，AF 1.80，WTSD 46.1% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 69.8%，PFR 52.0%，AF 1.98，WTSD 47.5% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 62.6%，PFR 4.1%，AF 1.65，WTSD 39.2% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 18.8%，PFR 14.1%，AF 2.07，WTSD 57.5% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 71.1%，PFR 41.0%，AF 1.88，WTSD 43.2% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 49.0%，PFR 40.6%，AF 2.09，WTSD 49.3% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 34.1%，PFR 17.0%，AF 1.83，WTSD 49.5% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 66.5%，PFR 23.3%，AF 1.77，WTSD 39.7% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 30.3%，PFR 28.4%，AF 2.25，WTSD 54.5% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 77.5%，PFR 31.5%，AF 1.83，WTSD 39.3% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 53.1%，PFR 32.6%，AF 1.94，WTSD 46.0% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 62.7%，PFR 56.1%，AF 2.14，WTSD 51.3% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 40.1%，PFR 7.4%，AF 1.71，WTSD 45.6% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 29.3%，PFR 11.1%，AF 1.76，WTSD 50.1% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 57.3%，PFR 17.3%，AF 1.77，WTSD 41.6% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 64.4%，PFR 12.3%，AF 1.72，WTSD 39.5% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 51.5%，PFR 22.5%，AF 1.83，WTSD 44.1% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 61.6%，PFR 42.0%，AF 1.93，WTSD 46.1% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 72.9%，PFR 55.5%，AF 1.99，WTSD 49.5% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 46.6%，PFR 12.8%，AF 1.76，WTSD 44.0% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 36.1%，PFR 27.5%，AF 2.08，WTSD 50.9% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 69.4%，PFR 59.2%，AF 2.08，WTSD 51.9% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 47.7%，PFR 27.1%，AF 1.90，WTSD 46.2% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 24.8%，PFR 12.5%，AF 1.83，WTSD 52.4% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 18.3%，PFR 4.1%，AF 1.75，WTSD 52.4% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 43.3%，PFR 34.5%，AF 2.06，WTSD 49.8% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 39.8%，PFR 20.9%，AF 1.89，WTSD 47.8% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 64.2%，PFR 53.0%，AF 2.05，WTSD 49.6% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 72.8%，PFR 15.2%，AF 1.73，WTSD 38.1% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 57.6%，PFR 50.1%，AF 2.11，WTSD 50.4% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 52.2%，PFR 38.8%，AF 1.99，WTSD 48.1% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 65.9%，PFR 35.4%，AF 1.88，WTSD 42.7% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 37.1%，PFR 14.0%，AF 1.79，WTSD 47.5% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 30.3%，PFR 22.4%，AF 2.00，WTSD 52.6% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 18.3%，PFR 9.5%，AF 1.86，WTSD 55.0% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 29.9%，PFR 6.0%，AF 1.72，WTSD 48.4% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 72.3%，PFR 27.1%，AF 1.80，WTSD 39.8% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 36.3%，PFR 23.1%，AF 1.93，WTSD 49.7% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 65.7%，PFR 47.2%，AF 2.01，WTSD 46.3% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 45.6%，PFR 8.3%，AF 1.70，WTSD 44.0% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 35.4%，PFR 9.8%，AF 1.74，WTSD 46.8% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 22.1%，PFR 16.4%，AF 2.04，WTSD 55.5% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 33.0%，PFR 12.3%，AF 1.78，WTSD 48.8% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 15.5%，PFR 11.7%，AF 2.11，WTSD 59.4% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 30.4%，PFR 15.0%，AF 1.85，WTSD 50.2% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 40.9%，PFR 11.1%，AF 1.74，WTSD 45.9% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 40.0%，PFR 31.1%，AF 2.04，WTSD 50.1% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 45.0%，PFR 31.2%，AF 1.96，WTSD 48.3% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 31.9%，PFR 19.8%，AF 1.91，WTSD 51.1% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '7-9p': {
      /** VPIP 24.2%，PFR 12.2%，AF 1.85，WTSD 49.3% */
      'gto': 'gto' as const,
      /** VPIP 72.9%，PFR 14.2%，AF 1.71，WTSD 35.8% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 8.6%，PFR 3.7%，AF 1.83，WTSD 56.2% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 50.8%，PFR 46.9%，AF 2.17，WTSD 65.8% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 28.8%，PFR 19.7%，AF 1.97，WTSD 50.6% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 39.8%，PFR 5.6%，AF 1.69，WTSD 40.7% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 64.8%，PFR 39.9%，AF 1.94，WTSD 50.8% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 22.2%，PFR 3.7%，AF 1.69，WTSD 46.7% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 44.2%，PFR 35.9%，AF 2.08，WTSD 52.9% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 16.7%，PFR 12.6%，AF 1.98，WTSD 56.4% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 46.1%，PFR 21.3%，AF 1.86，WTSD 43.2% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 15.1%，PFR 4.3%，AF 1.70，WTSD 51.7% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 29.5%，PFR 10.7%，AF 1.79，WTSD 46.1% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 54.5%，PFR 41.3%，AF 2.04，WTSD 55.8% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 50.8%，PFR 2.3%，AF 1.62，WTSD 37.0% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 11.8%，PFR 9.0%，AF 2.02，WTSD 59.2% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 58.5%，PFR 33.3%，AF 1.88，WTSD 46.2% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 35.1%，PFR 29.7%，AF 2.15，WTSD 52.9% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 22.6%，PFR 11.2%，AF 1.82，WTSD 50.3% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 55.4%，PFR 17.2%，AF 1.79，WTSD 39.0% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 19.7%，PFR 18.5%，AF 2.27，WTSD 57.6% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 68.6%，PFR 25.5%，AF 1.79，WTSD 39.9% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 39.4%，PFR 24.4%，AF 1.94，WTSD 46.9% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 46.6%，PFR 42.3%，AF 2.16，WTSD 59.3% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 27.9%，PFR 4.2%，AF 1.69，WTSD 44.4% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 18.9%，PFR 7.0%，AF 1.74，WTSD 50.0% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 44.9%，PFR 11.7%，AF 1.75，WTSD 40.7% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 53.6%，PFR 8.1%，AF 1.70，WTSD 37.8% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 38.6%，PFR 15.6%，AF 1.83，WTSD 44.0% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 47.4%，PFR 32.9%，AF 1.99，WTSD 49.0% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 56.9%，PFR 44.3%，AF 2.04，WTSD 59.9% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 33.9%，PFR 7.9%，AF 1.73，WTSD 43.5% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 24.0%，PFR 18.7%，AF 2.11，WTSD 53.2% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 52.3%，PFR 45.6%，AF 2.11，WTSD 63.2% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 34.4%，PFR 19.4%，AF 1.92，WTSD 47.0% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 15.4%，PFR 7.9%，AF 1.79，WTSD 53.3% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 11.8%，PFR 2.5%，AF 1.70，WTSD 51.8% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 30.2%，PFR 24.5%，AF 2.09，WTSD 52.7% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 27.6%，PFR 14.3%，AF 1.89，WTSD 48.3% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 48.3%，PFR 40.8%，AF 2.10，WTSD 56.9% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 64.0%，PFR 10.9%，AF 1.70，WTSD 36.5% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 42.5%，PFR 37.7%，AF 2.16，WTSD 55.6% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 38.1%，PFR 29.0%，AF 2.06，WTSD 50.6% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 53.2%，PFR 27.9%，AF 1.89，WTSD 44.0% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 25.0%，PFR 8.9%，AF 1.77，WTSD 47.9% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 19.7%，PFR 14.9%，AF 2.01，WTSD 55.1% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 11.5%，PFR 6.1%，AF 1.83，WTSD 56.3% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 19.3%，PFR 3.5%，AF 1.69，WTSD 48.1% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 62.4%，PFR 21.1%，AF 1.78，WTSD 39.3% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 24.3%，PFR 15.8%，AF 1.93，WTSD 51.3% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 51.0%，PFR 37.5%，AF 2.00，WTSD 52.3% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 33.0%，PFR 4.7%，AF 1.68，WTSD 42.9% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 23.6%，PFR 5.8%，AF 1.72，WTSD 46.8% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 13.7%，PFR 10.5%，AF 2.02，WTSD 57.7% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 21.6%，PFR 7.8%，AF 1.76，WTSD 49.3% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 10.0%，PFR 7.7%，AF 2.07，WTSD 60.2% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 19.5%，PFR 9.7%，AF 1.81，WTSD 51.7% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 28.5%，PFR 6.7%，AF 1.72，WTSD 45.2% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 27.4%，PFR 21.8%，AF 2.08，WTSD 52.8% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 31.7%，PFR 22.4%，AF 1.99，WTSD 50.4% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 20.7%，PFR 13.2%，AF 1.91，WTSD 52.9% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
  },
  '3-50': {
    '2-3p': {},
    '4-6p': {
      /** VPIP 41.1%，PFR 20.2%，AF 1.83，WTSD 48.2% */
      'gto': 'gto' as const,
      /** VPIP 83.2%，PFR 15.6%，AF 1.70，WTSD 36.5% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 17.3%，PFR 7.2%，AF 1.78，WTSD 55.2% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 68.6%，PFR 61.1%，AF 2.09，WTSD 57.8% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 45.5%，PFR 29.6%，AF 1.93，WTSD 49.3% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 59.6%，PFR 9.7%，AF 1.66，WTSD 40.6% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 79.8%，PFR 43.2%，AF 1.82，WTSD 44.3% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 40.0%，PFR 7.4%，AF 1.69，WTSD 45.2% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 60.2%，PFR 45.4%，AF 1.99，WTSD 49.6% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 31.0%，PFR 23.2%，AF 2.05，WTSD 54.4% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 63.0%，PFR 27.0%，AF 1.79，WTSD 42.9% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 29.0%，PFR 8.3%，AF 1.76，WTSD 48.5% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 47.5%，PFR 17.4%，AF 1.78，WTSD 45.0% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 71.1%，PFR 48.3%，AF 1.91，WTSD 47.9% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 70.0%，PFR 4.3%，AF 1.60，WTSD 37.2% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 22.9%，PFR 17.6%，AF 2.06，WTSD 58.0% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 73.6%，PFR 36.8%，AF 1.81，WTSD 43.0% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 51.0%，PFR 41.3%，AF 2.06，WTSD 51.0% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 39.1%，PFR 19.2%，AF 1.82，WTSD 48.9% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 70.9%，PFR 20.7%，AF 1.74，WTSD 39.6% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 34.1%，PFR 31.9%，AF 2.21，WTSD 56.8% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 80.5%，PFR 26.8%，AF 1.73，WTSD 39.3% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 56.3%，PFR 32.3%，AF 1.88，WTSD 46.0% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 62.8%，PFR 54.5%，AF 2.10，WTSD 54.0% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 47.1%，PFR 8.1%，AF 1.69，WTSD 43.2% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 34.9%，PFR 12.9%，AF 1.77，WTSD 48.6% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 63.2%，PFR 16.7%，AF 1.71，WTSD 40.9% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 70.6%，PFR 11.6%，AF 1.67，WTSD 38.3% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 56.5%，PFR 22.3%，AF 1.77，WTSD 43.6% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 63.6%，PFR 39.9%，AF 1.88，WTSD 46.2% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 74.5%，PFR 52.1%，AF 1.92，WTSD 50.1% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 52.9%，PFR 13.4%，AF 1.71，WTSD 42.8% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 39.9%，PFR 30.3%，AF 2.10，WTSD 51.3% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 69.8%，PFR 56.9%，AF 2.02，WTSD 53.9% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 51.5%，PFR 27.7%，AF 1.84，WTSD 46.5% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 29.2%，PFR 14.6%，AF 1.82，WTSD 51.5% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 23.4%，PFR 5.1%，AF 1.70，WTSD 49.9% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 46.2%，PFR 36.1%，AF 2.05，WTSD 51.4% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 44.9%，PFR 22.6%，AF 1.85，WTSD 46.9% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 64.9%，PFR 50.9%，AF 2.00，WTSD 51.1% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 77.6%，PFR 13.5%，AF 1.66，WTSD 37.6% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 58.3%，PFR 49.4%，AF 2.06，WTSD 52.8% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 54.4%，PFR 38.9%，AF 1.98，WTSD 49.0% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 69.0%，PFR 32.3%，AF 1.81，WTSD 42.3% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 42.6%，PFR 15.5%，AF 1.76，WTSD 46.5% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 34.5%，PFR 25.6%，AF 1.99，WTSD 53.6% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 22.8%，PFR 11.9%，AF 1.82，WTSD 54.7% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 35.9%，PFR 6.9%，AF 1.69，WTSD 46.2% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 76.0%，PFR 23.5%，AF 1.73，WTSD 39.5% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 40.6%，PFR 25.5%，AF 1.92，WTSD 50.1% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 67.4%，PFR 44.5%，AF 1.92，WTSD 47.0% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 52.7%，PFR 8.8%，AF 1.68，WTSD 41.8% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 41.8%，PFR 11.0%，AF 1.71，WTSD 45.7% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 26.2%，PFR 19.9%，AF 2.00，WTSD 56.8% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 38.4%，PFR 14.1%，AF 1.75，WTSD 47.6% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 19.4%，PFR 15.0%，AF 2.05，WTSD 59.8% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 35.5%，PFR 17.4%，AF 1.82，WTSD 49.9% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 47.1%，PFR 11.9%，AF 1.70，WTSD 44.1% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 43.4%，PFR 33.4%，AF 2.03，WTSD 51.8% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 48.3%，PFR 32.3%，AF 1.92，WTSD 49.2% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 36.5%，PFR 22.6%，AF 1.89，WTSD 51.2% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
    '7-9p': {
      /** VPIP 29.5%，PFR 14.1%，AF 1.80，WTSD 49.8% */
      'gto': 'gto' as const,
      /** VPIP 77.7%，PFR 11.5%，AF 1.60，WTSD 35.5% */
      'vpip80-pfr16': 'vpip80-pfr16' as const,
      /** VPIP 11.8%，PFR 5.2%，AF 1.75，WTSD 54.9% */
      'vpip20-pfr10': 'vpip20-pfr10' as const,
      /** VPIP 51.4%，PFR 46.0%，AF 2.14，WTSD 68.9% */
      'vpip69-pfr53': 'vpip69-pfr53' as const,
      /** VPIP 33.0%，PFR 21.3%，AF 1.92，WTSD 52.4% */
      'vpip47-pfr28': 'vpip47-pfr28' as const,
      /** VPIP 49.1%，PFR 6.1%，AF 1.56，WTSD 38.9% */
      'vpip60-pfr12': 'vpip60-pfr12' as const,
      /** VPIP 69.0%，PFR 35.3%，AF 1.81，WTSD 48.3% */
      'vpip79-pfr36': 'vpip79-pfr36' as const,
      /** VPIP 28.7%，PFR 4.6%，AF 1.60，WTSD 45.1% */
      'vpip41-pfr10': 'vpip41-pfr10' as const,
      /** VPIP 46.0%，PFR 34.4%，AF 2.00，WTSD 55.7% */
      'vpip60-pfr39': 'vpip60-pfr39' as const,
      /** VPIP 20.6%，PFR 15.8%，AF 2.03，WTSD 58.6% */
      'vpip33-pfr23': 'vpip33-pfr23' as const,
      /** VPIP 51.9%，PFR 19.6%，AF 1.73，WTSD 43.0% */
      'vpip64-pfr25': 'vpip64-pfr25' as const,
      /** VPIP 19.8%，PFR 5.5%，AF 1.63，WTSD 49.6% */
      'vpip31-pfr11': 'vpip31-pfr11' as const,
      /** VPIP 36.0%，PFR 11.8%，AF 1.70，WTSD 45.7% */
      'vpip50-pfr19': 'vpip50-pfr19' as const,
      /** VPIP 57.0%，PFR 38.3%，AF 1.91，WTSD 55.2% */
      'vpip70-pfr39': 'vpip70-pfr39' as const,
      /** VPIP 61.0%，PFR 2.7%，AF 1.49，WTSD 34.9% */
      'vpip68-pfr7': 'vpip68-pfr7' as const,
      /** VPIP 15.3%，PFR 12.0%，AF 2.03，WTSD 60.9% */
      'vpip25-pfr18': 'vpip25-pfr18' as const,
      /** VPIP 62.5%，PFR 28.9%，AF 1.76，WTSD 44.8% */
      'vpip72-pfr30': 'vpip72-pfr30' as const,
      /** VPIP 37.5%，PFR 30.3%，AF 2.09，WTSD 56.3% */
      'vpip52-pfr37': 'vpip52-pfr37' as const,
      /** VPIP 27.6%，PFR 13.3%，AF 1.79，WTSD 50.7% */
      'vpip41-pfr20': 'vpip41-pfr20' as const,
      /** VPIP 62.2%，PFR 14.9%，AF 1.64，WTSD 38.5% */
      'vpip70-pfr20': 'vpip70-pfr20' as const,
      /** VPIP 23.2%，PFR 21.7%，AF 2.30，WTSD 61.2% */
      'vpip35-pfr30': 'vpip35-pfr30' as const,
      /** VPIP 73.0%，PFR 20.7%，AF 1.66，WTSD 38.6% */
      'vpip78-pfr23': 'vpip78-pfr23' as const,
      /** VPIP 44.1%，PFR 24.1%，AF 1.88，WTSD 47.8% */
      'vpip58-pfr29': 'vpip58-pfr29' as const,
      /** VPIP 47.1%，PFR 40.9%，AF 2.14，WTSD 62.6% */
      'vpip61-pfr46': 'vpip61-pfr46' as const,
      /** VPIP 35.5%，PFR 5.0%，AF 1.59，WTSD 42.8% */
      'vpip48-pfr11': 'vpip48-pfr11' as const,
      /** VPIP 24.0%，PFR 8.8%，AF 1.73，WTSD 49.9% */
      'vpip37-pfr15': 'vpip37-pfr15' as const,
      /** VPIP 53.2%，PFR 11.3%，AF 1.61，WTSD 39.6% */
      'vpip63-pfr17': 'vpip63-pfr17' as const,
      /** VPIP 62.2%，PFR 7.7%，AF 1.56，WTSD 36.6% */
      'vpip69-pfr13': 'vpip69-pfr13' as const,
      /** VPIP 45.1%，PFR 15.6%，AF 1.72，WTSD 43.4% */
      'vpip58-pfr22': 'vpip58-pfr22' as const,
      /** VPIP 50.5%，PFR 30.6%，AF 1.89，WTSD 49.8% */
      'vpip64-pfr34': 'vpip64-pfr34' as const,
      /** VPIP 59.7%，PFR 41.7%，AF 1.95，WTSD 58.9% */
      'vpip75-pfr43': 'vpip75-pfr43' as const,
      /** VPIP 41.9%，PFR 8.7%，AF 1.61，WTSD 42.1% */
      'vpip54-pfr15': 'vpip54-pfr15' as const,
      /** VPIP 27.8%，PFR 21.1%，AF 2.05，WTSD 55.7% */
      'vpip42-pfr29': 'vpip42-pfr29' as const,
      /** VPIP 53.6%，PFR 44.0%，AF 2.07，WTSD 65.2% */
      'vpip69-pfr47': 'vpip69-pfr47' as const,
      /** VPIP 39.2%，PFR 19.9%，AF 1.82，WTSD 48.0% */
      'vpip53-pfr26': 'vpip53-pfr26' as const,
      /** VPIP 19.7%，PFR 10.3%，AF 1.76，WTSD 54.0% */
      'vpip31-pfr16': 'vpip31-pfr16' as const,
      /** VPIP 16.0%，PFR 3.4%，AF 1.66，WTSD 49.2% */
      'vpip25-pfr8': 'vpip25-pfr8' as const,
      /** VPIP 33.2%，PFR 26.0%，AF 2.07，WTSD 55.9% */
      'vpip47-pfr34': 'vpip47-pfr34' as const,
      /** VPIP 32.9%，PFR 16.0%，AF 1.82，WTSD 48.9% */
      'vpip47-pfr23': 'vpip47-pfr23' as const,
      /** VPIP 49.8%，PFR 38.9%，AF 2.03，WTSD 58.8% */
      'vpip64-pfr42': 'vpip64-pfr42' as const,
      /** VPIP 70.9%，PFR 9.3%，AF 1.57，WTSD 35.7% */
      'vpip75-pfr14': 'vpip75-pfr14' as const,
      /** VPIP 43.5%，PFR 36.8%，AF 2.12，WTSD 59.3% */
      'vpip57-pfr43': 'vpip57-pfr43' as const,
      /** VPIP 40.9%，PFR 28.8%，AF 1.98，WTSD 53.0% */
      'vpip55-pfr35': 'vpip55-pfr35' as const,
      /** VPIP 58.1%，PFR 24.6%，AF 1.75，WTSD 43.5% */
      'vpip69-pfr28': 'vpip69-pfr28' as const,
      /** VPIP 31.1%，PFR 10.4%，AF 1.70，WTSD 47.2% */
      'vpip45-pfr17': 'vpip45-pfr17' as const,
      /** VPIP 23.6%，PFR 17.8%，AF 2.03，WTSD 57.1% */
      'vpip36-pfr25': 'vpip36-pfr25' as const,
      /** VPIP 15.3%，PFR 8.5%，AF 1.81，WTSD 56.0% */
      'vpip25-pfr14': 'vpip25-pfr14' as const,
      /** VPIP 25.2%，PFR 4.3%，AF 1.62，WTSD 46.2% */
      'vpip37-pfr9': 'vpip37-pfr9' as const,
      /** VPIP 68.0%，PFR 17.6%，AF 1.65，WTSD 38.3% */
      'vpip74-pfr21': 'vpip74-pfr21' as const,
      /** VPIP 28.7%，PFR 18.0%，AF 1.91，WTSD 53.1% */
      'vpip43-pfr25': 'vpip43-pfr25' as const,
      /** VPIP 53.5%，PFR 34.8%，AF 1.96，WTSD 51.6% */
      'vpip67-pfr37': 'vpip67-pfr37' as const,
      /** VPIP 41.6%，PFR 5.5%，AF 1.58，WTSD 40.9% */
      'vpip54-pfr11': 'vpip54-pfr11' as const,
      /** VPIP 30.6%，PFR 7.0%，AF 1.62，WTSD 45.1% */
      'vpip43-pfr13': 'vpip43-pfr13' as const,
      /** VPIP 17.4%，PFR 13.5%，AF 2.02，WTSD 59.6% */
      'vpip28-pfr20': 'vpip28-pfr20' as const,
      /** VPIP 27.3%，PFR 9.6%，AF 1.71，WTSD 48.6% */
      'vpip40-pfr16': 'vpip40-pfr16' as const,
      /** VPIP 13.2%，PFR 10.5%，AF 2.02，WTSD 61.8% */
      'vpip22-pfr16': 'vpip22-pfr16' as const,
      /** VPIP 24.4%，PFR 12.1%，AF 1.78，WTSD 52.1% */
      'vpip37-pfr18': 'vpip37-pfr18' as const,
      /** VPIP 35.8%，PFR 7.7%，AF 1.63，WTSD 44.0% */
      'vpip49-pfr14': 'vpip49-pfr14' as const,
      /** VPIP 30.9%，PFR 23.8%，AF 2.05，WTSD 55.8% */
      'vpip45-pfr32': 'vpip45-pfr32' as const,
      /** VPIP 35.4%，PFR 23.4%，AF 1.94，WTSD 52.6% */
      'vpip50-pfr30': 'vpip50-pfr30' as const,
      /** VPIP 25.2%，PFR 15.8%，AF 1.89，WTSD 54.2% */
      'vpip38-pfr23': 'vpip38-pfr23' as const,
    },
  },
} as const

/**
 * 翻后档位名称提示清单（三维：盲注结构 → 人数范围 → 档位名）
 * @example POSTFLOP_PROFILE_NAME_HINTS_BY_FORMAT['2-0']['7-9p']['gto']
 */
export const POSTFLOP_PROFILE_NAME_HINTS_BY_FORMAT = {
  '2-0': {
    '2-3p': {
      /** VPIP 65.6%，PFR 39.8%，AF 1.84，WTSD 46.9% */
      'gto': 'gto' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 6.65，WTSD 29.7% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 65.3%，PFR 39.7%，AF 0.64，WTSD 73.6% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 2.86，WTSD 38.2% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 65.4%，PFR 39.6%，AF 1.54，WTSD 49.1% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 65.5%，PFR 39.7%，AF 4.39，WTSD 30.6% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 7.38，WTSD 25.0% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 5.25，WTSD 27.7% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 65.4%，PFR 39.8%，AF 1.09，WTSD 62.8% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 65.3%，PFR 39.5%，AF 3.59，WTSD 32.8% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 65.6%，PFR 39.8%，AF 1.76，WTSD 64.7% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 2.19，WTSD 42.7% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 0.76，WTSD 65.2% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 65.1%，PFR 39.6%，AF 1.26，WTSD 54.8% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 64.8%，PFR 39.7%，AF 3.25，WTSD 36.9% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 4.16，WTSD 34.8% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 65.5%，PFR 39.7%，AF 4.96，WTSD 30.2% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 65.5%，PFR 39.6%，AF 6.90，WTSD 27.2% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 1.73，WTSD 56.0% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 65.5%，PFR 39.7%，AF 4.13，WTSD 28.3% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 65.5%，PFR 39.7%，AF 2.48，WTSD 39.0% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 65.6%，PFR 39.8%，AF 6.03，WTSD 28.1% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 65.1%，PFR 39.7%，AF 1.82，WTSD 47.9% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 65.5%，PFR 39.9%，AF 7.19，WTSD 26.1% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 5.77，WTSD 30.9% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 65.4%，PFR 39.6%，AF 5.79，WTSD 25.5% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 3.03，WTSD 35.3% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 2.30，WTSD 38.4% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 3.81，WTSD 31.4% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 65.4%，PFR 39.6%，AF 4.86，WTSD 32.6% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 65.0%，PFR 39.7%，AF 2.00，WTSD 43.2% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 65.3%，PFR 39.6%，AF 6.41，WTSD 26.1% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 65.5%，PFR 39.7%，AF 0.69，WTSD 69.5% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 65.5%，PFR 39.8%，AF 3.29，WTSD 32.5% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 65.3%，PFR 39.7%，AF 4.15，WTSD 31.4% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 65.4%，PFR 39.8%，AF 1.29，WTSD 59.3% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 4.59，WTSD 29.3% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 65.4%，PFR 39.8%，AF 1.42，WTSD 52.0% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 65.6%，PFR 39.6%，AF 5.12，WTSD 28.8% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 65.4%，PFR 39.8%，AF 2.79，WTSD 41.4% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 65.4%，PFR 39.7%，AF 2.71，WTSD 35.9% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '4-6p': {
      /** VPIP 36.3%，PFR 19.3%，AF 1.84，WTSD 45.0% */
      'gto': 'gto' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 6.82，WTSD 28.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 0.57，WTSD 73.5% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 2.88，WTSD 36.8% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 1.52，WTSD 47.5% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 4.51，WTSD 29.9% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 36.4%，PFR 19.4%，AF 7.68，WTSD 24.6% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 36.4%，PFR 19.2%，AF 5.43，WTSD 27.1% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 1.04，WTSD 61.7% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 36.0%，PFR 19.4%，AF 3.76，WTSD 31.5% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 1.67，WTSD 63.4% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 2.20，WTSD 40.9% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 0.69，WTSD 64.8% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 36.1%，PFR 19.3%，AF 1.22，WTSD 53.0% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 36.1%，PFR 19.4%，AF 3.31，WTSD 35.9% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 4.20，WTSD 33.3% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 5.05，WTSD 29.2% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 7.08，WTSD 26.4% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 36.2%，PFR 19.3%，AF 1.67，WTSD 54.6% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 4.43，WTSD 27.9% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 2.51，WTSD 37.5% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 6.15，WTSD 27.3% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 35.9%，PFR 19.1%，AF 1.75，WTSD 46.8% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 36.4%，PFR 19.2%，AF 7.34，WTSD 25.5% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 5.90，WTSD 29.8% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 6.04，WTSD 25.5% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 3.09，WTSD 33.8% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 2.33，WTSD 37.3% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 3.87，WTSD 30.7% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 4.85，WTSD 31.8% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 36.1%，PFR 19.4%，AF 1.97，WTSD 42.1% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 6.66，WTSD 25.5% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 0.63，WTSD 68.6% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 3.41，WTSD 31.4% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 4.19，WTSD 30.2% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 1.22，WTSD 57.9% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 4.67，WTSD 28.4% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 36.3%，PFR 19.3%，AF 1.39，WTSD 50.7% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 5.28，WTSD 28.1% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 36.2%，PFR 19.2%，AF 2.76，WTSD 40.1% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 36.3%，PFR 19.2%，AF 2.74，WTSD 34.6% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '7-9p': {
      /** VPIP 24.4%，PFR 11.8%，AF 1.80，WTSD 45.4% */
      'gto': 'gto' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 6.70，WTSD 29.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 0.55，WTSD 74.2% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 2.84，WTSD 37.0% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 1.50，WTSD 47.6% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 4.43，WTSD 30.4% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 24.3%，PFR 11.7%，AF 7.57，WTSD 25.6% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 5.39，WTSD 28.0% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 1.00，WTSD 62.2% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 24.4%，PFR 12.0%，AF 3.60，WTSD 32.4% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 1.62，WTSD 63.7% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 2.15，WTSD 41.4% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 0.68，WTSD 65.3% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 24.2%，PFR 11.9%，AF 1.21，WTSD 53.1% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 3.18，WTSD 36.0% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 4.10，WTSD 34.2% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 4.98，WTSD 29.8% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 24.5%，PFR 11.8%，AF 7.04，WTSD 27.2% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 24.3%，PFR 11.9%，AF 1.61，WTSD 54.9% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 4.43，WTSD 28.7% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 2.47，WTSD 38.1% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 6.14，WTSD 28.2% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 1.75，WTSD 47.3% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 7.39，WTSD 26.6% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 5.81，WTSD 30.5% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 6.02，WTSD 26.1% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 3.01，WTSD 34.7% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 2.34，WTSD 37.6% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 3.81，WTSD 31.3% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 4.81，WTSD 32.4% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 24.2%，PFR 11.9%，AF 2.00，WTSD 41.8% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 6.64，WTSD 26.5% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 0.60，WTSD 69.6% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 3.39，WTSD 31.9% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 4.16，WTSD 31.2% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 1.19，WTSD 58.2% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 24.4%，PFR 11.9%，AF 4.65，WTSD 29.4% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 1.37，WTSD 51.0% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 5.16，WTSD 29.0% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 24.4%，PFR 11.8%，AF 2.69，WTSD 40.3% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 24.3%，PFR 11.8%，AF 2.75，WTSD 35.0% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
  },
  '2-50': {
    '2-3p': {
      /** VPIP 70.8%，PFR 42.0%，AF 1.89，WTSD 45.7% */
      'gto': 'gto' as const,
      /** VPIP 71.0%，PFR 42.0%，AF 6.57，WTSD 31.9% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 70.9%，PFR 41.9%，AF 0.65，WTSD 72.1% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 71.0%，PFR 41.9%，AF 2.84，WTSD 39.5% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 70.5%，PFR 41.6%，AF 1.52，WTSD 49.0% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 70.9%，PFR 42.1%，AF 4.39，WTSD 30.9% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 71.0%，PFR 41.9%，AF 7.15，WTSD 26.7% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 70.7%，PFR 42.0%，AF 5.30，WTSD 29.1% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 71.1%，PFR 41.7%，AF 1.11，WTSD 62.8% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 71.7%，PFR 43.0%，AF 3.69，WTSD 31.9% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 70.9%，PFR 42.2%，AF 1.79，WTSD 63.2% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 70.7%，PFR 41.9%，AF 2.18，WTSD 42.7% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 70.9%，PFR 42.1%，AF 0.77，WTSD 64.4% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 70.6%，PFR 41.7%，AF 1.30，WTSD 52.8% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 70.9%，PFR 41.7%，AF 3.33，WTSD 37.0% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 70.9%，PFR 41.9%，AF 4.27，WTSD 35.6% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 71.1%，PFR 41.7%，AF 4.90，WTSD 31.3% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 70.7%，PFR 41.6%，AF 6.63，WTSD 29.1% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 71.2%，PFR 42.2%，AF 1.78，WTSD 54.5% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 70.9%，PFR 41.7%，AF 3.75，WTSD 29.6% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 70.7%，PFR 41.8%，AF 2.51，WTSD 39.4% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 70.8%，PFR 41.8%，AF 5.92，WTSD 29.6% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 71.4%，PFR 43.1%，AF 1.80，WTSD 47.9% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 70.7%，PFR 41.4%，AF 6.95，WTSD 28.1% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 70.7%，PFR 41.6%，AF 5.74，WTSD 32.2% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 70.8%，PFR 41.8%，AF 5.68，WTSD 27.1% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 70.6%，PFR 41.6%，AF 3.12，WTSD 35.5% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 70.8%，PFR 41.8%，AF 2.24，WTSD 39.1% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 70.8%，PFR 42.1%，AF 3.86，WTSD 32.5% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 70.9%，PFR 41.9%，AF 4.94，WTSD 34.7% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 71.2%，PFR 42.3%，AF 2.07，WTSD 41.6% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 70.8%，PFR 42.0%，AF 6.28，WTSD 27.6% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 71.1%，PFR 42.3%，AF 0.69，WTSD 67.0% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 70.9%，PFR 41.7%，AF 3.27，WTSD 33.1% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 71.2%，PFR 42.0%，AF 4.20，WTSD 32.1% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 70.8%，PFR 41.8%，AF 1.29，WTSD 58.5% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 70.9%，PFR 41.8%，AF 4.53，WTSD 30.7% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 70.7%，PFR 41.7%，AF 1.42，WTSD 51.7% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 71.1%，PFR 42.1%，AF 5.22，WTSD 28.8% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 70.7%，PFR 41.9%，AF 2.85，WTSD 41.6% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 71.1%，PFR 41.9%，AF 2.79，WTSD 35.8% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '4-6p': {
      /** VPIP 43.7%，PFR 21.2%，AF 1.80，WTSD 43.9% */
      'gto': 'gto' as const,
      /** VPIP 43.4%，PFR 21.1%，AF 6.51，WTSD 29.9% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 43.4%，PFR 21.0%，AF 0.53，WTSD 71.6% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 43.5%，PFR 21.3%，AF 2.95，WTSD 35.7% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 43.0%，PFR 20.8%，AF 1.43，WTSD 46.5% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 43.5%，PFR 21.1%，AF 4.57，WTSD 29.8% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 43.3%，PFR 20.8%，AF 7.29，WTSD 25.9% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 43.5%，PFR 21.0%，AF 5.24，WTSD 28.0% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 43.4%，PFR 21.3%，AF 1.00，WTSD 59.9% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 42.9%，PFR 20.7%，AF 3.94，WTSD 30.0% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 43.8%，PFR 21.3%，AF 1.72，WTSD 59.7% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 43.6%，PFR 21.1%，AF 2.18，WTSD 39.8% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 43.5%，PFR 21.0%，AF 0.65，WTSD 62.3% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 43.8%，PFR 21.5%，AF 1.25，WTSD 51.4% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 43.2%，PFR 20.6%，AF 3.37，WTSD 34.7% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 43.4%，PFR 21.1%，AF 4.26，WTSD 32.8% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 43.5%，PFR 21.0%，AF 4.90，WTSD 29.5% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 43.4%，PFR 21.2%，AF 6.97，WTSD 28.0% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 43.7%，PFR 21.1%，AF 1.67，WTSD 52.2% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 43.4%，PFR 20.9%，AF 3.77，WTSD 28.8% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 43.3%，PFR 21.2%，AF 2.54，WTSD 36.6% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 43.1%，PFR 20.8%，AF 5.89，WTSD 28.4% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 43.8%，PFR 21.1%，AF 1.71，WTSD 45.1% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 43.2%，PFR 20.9%，AF 7.12，WTSD 26.6% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 43.1%，PFR 21.1%，AF 5.56，WTSD 30.8% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 43.4%，PFR 20.9%，AF 5.85，WTSD 26.6% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 43.5%，PFR 21.2%，AF 3.10，WTSD 33.7% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 43.4%，PFR 21.3%，AF 2.33，WTSD 35.6% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 43.3%，PFR 21.0%，AF 3.90，WTSD 30.2% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 43.3%，PFR 20.9%，AF 4.90，WTSD 31.6% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 43.8%，PFR 21.3%，AF 1.94，WTSD 41.3% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 43.3%，PFR 21.1%，AF 6.47，WTSD 26.6% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 43.5%，PFR 21.3%，AF 0.59，WTSD 66.8% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 43.5%，PFR 21.1%，AF 3.38，WTSD 30.4% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 43.4%，PFR 20.7%，AF 4.31，WTSD 30.1% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 43.5%，PFR 21.3%，AF 1.20，WTSD 56.0% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 43.1%，PFR 21.0%，AF 4.72，WTSD 29.0% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 43.3%，PFR 20.9%，AF 1.35，WTSD 49.4% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 43.5%，PFR 21.1%，AF 5.19，WTSD 28.3% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 43.5%，PFR 21.4%，AF 2.81，WTSD 38.6% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 43.6%，PFR 21.2%，AF 2.70，WTSD 34.5% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '7-9p': {
      /** VPIP 32.1%，PFR 13.2%，AF 1.73，WTSD 44.9% */
      'gto': 'gto' as const,
      /** VPIP 32.2%，PFR 13.3%，AF 6.06，WTSD 33.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 32.1%，PFR 13.3%，AF 0.47，WTSD 73.7% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 32.0%，PFR 13.0%，AF 2.84，WTSD 38.1% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 32.3%，PFR 13.1%，AF 1.42，WTSD 48.2% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 32.4%，PFR 13.2%，AF 4.33，WTSD 33.2% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 32.1%，PFR 13.1%，AF 7.12，WTSD 29.8% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 5.02，WTSD 32.0% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 31.9%，PFR 13.1%，AF 0.92，WTSD 61.4% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 31.8%，PFR 13.4%，AF 3.34，WTSD 34.2% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 32.2%，PFR 13.1%，AF 1.62，WTSD 59.6% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 32.2%，PFR 13.3%，AF 2.13，WTSD 42.1% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 32.3%，PFR 13.2%，AF 0.59，WTSD 64.6% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 32.3%，PFR 13.5%，AF 1.13，WTSD 53.6% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 32.6%，PFR 13.2%，AF 3.33，WTSD 35.5% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 32.3%，PFR 13.1%，AF 3.94，WTSD 36.0% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 32.0%，PFR 13.2%，AF 4.87，WTSD 33.0% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 32.3%，PFR 13.3%，AF 6.37，WTSD 31.4% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 32.0%，PFR 13.2%，AF 1.59，WTSD 51.8% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 32.0%，PFR 13.1%，AF 3.70，WTSD 33.2% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 2.40，WTSD 39.0% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 32.1%，PFR 13.1%，AF 5.90，WTSD 32.0% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 32.0%，PFR 12.9%，AF 1.67，WTSD 46.8% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 32.1%，PFR 13.3%，AF 7.03，WTSD 30.4% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 5.28，WTSD 34.6% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 32.1%，PFR 13.1%，AF 5.74，WTSD 30.0% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 2.95，WTSD 36.2% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 2.22，WTSD 38.7% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 3.79，WTSD 33.7% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 32.3%，PFR 13.3%，AF 4.46，WTSD 35.6% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 31.9%，PFR 13.3%，AF 1.92，WTSD 41.8% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 6.21，WTSD 30.4% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 32.2%，PFR 13.2%，AF 0.52，WTSD 68.4% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 3.33，WTSD 34.6% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 32.2%，PFR 13.1%，AF 4.09，WTSD 33.7% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 1.14，WTSD 57.3% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 32.3%，PFR 13.3%，AF 4.53，WTSD 32.1% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 32.1%，PFR 13.4%，AF 1.27，WTSD 51.0% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 4.90，WTSD 31.8% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 32.1%，PFR 13.3%，AF 2.74，WTSD 40.8% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 32.1%，PFR 13.2%，AF 2.73，WTSD 36.5% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
  },
  '2-100': {
    '2-3p': {
      /** VPIP 77.0%，PFR 41.5%，AF 1.86，WTSD 45.1% */
      'gto': 'gto' as const,
      /** VPIP 77.2%，PFR 41.6%，AF 6.50，WTSD 31.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 77.3%，PFR 41.8%，AF 0.63，WTSD 71.0% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 77.2%，PFR 41.8%，AF 2.90，WTSD 38.0% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 77.3%，PFR 41.8%，AF 1.50，WTSD 47.8% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 77.1%，PFR 41.6%，AF 4.38，WTSD 31.4% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 77.2%，PFR 41.6%，AF 7.12，WTSD 26.8% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 77.2%，PFR 41.8%，AF 5.21，WTSD 28.8% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 77.1%，PFR 41.6%，AF 1.09，WTSD 60.8% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 77.2%，PFR 41.9%，AF 3.58，WTSD 32.8% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 77.1%，PFR 41.7%，AF 1.79，WTSD 62.3% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 2.21，WTSD 41.7% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 77.3%，PFR 41.9%，AF 0.75，WTSD 62.9% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 76.8%，PFR 42.0%，AF 1.25，WTSD 52.5% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 77.0%，PFR 41.6%，AF 3.38，WTSD 37.1% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 77.1%，PFR 41.6%，AF 4.23，WTSD 35.3% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 77.2%，PFR 41.9%，AF 4.95，WTSD 31.1% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 77.2%，PFR 41.8%，AF 6.68，WTSD 28.8% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 77.1%，PFR 41.5%，AF 1.75，WTSD 53.9% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 77.2%，PFR 41.8%，AF 3.59，WTSD 29.8% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 2.51，WTSD 38.4% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 77.1%，PFR 41.8%，AF 5.95，WTSD 29.7% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 76.8%，PFR 42.0%，AF 1.80，WTSD 46.9% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 77.3%，PFR 41.7%，AF 6.91，WTSD 27.5% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 77.3%，PFR 41.8%，AF 5.70，WTSD 32.7% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 77.2%，PFR 41.6%，AF 5.64，WTSD 27.1% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 3.06，WTSD 35.1% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 77.0%，PFR 41.8%，AF 2.27，WTSD 38.3% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 3.83，WTSD 32.0% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 77.3%，PFR 41.6%，AF 4.78，WTSD 33.9% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 76.9%，PFR 42.0%，AF 2.02，WTSD 41.9% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 6.28，WTSD 27.6% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 0.67，WTSD 66.9% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 77.2%，PFR 41.7%，AF 3.31，WTSD 32.5% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 77.1%，PFR 41.6%，AF 4.15，WTSD 32.0% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 77.3%，PFR 41.9%，AF 1.29，WTSD 57.3% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 77.3%，PFR 41.9%，AF 4.63，WTSD 30.1% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 77.1%，PFR 41.6%，AF 1.40，WTSD 50.8% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 77.1%，PFR 41.7%，AF 5.03，WTSD 29.9% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 77.1%，PFR 41.8%，AF 2.85，WTSD 40.8% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 77.1%，PFR 41.7%，AF 2.71，WTSD 35.5% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '4-6p': {
      /** VPIP 52.5%，PFR 20.2%，AF 1.72，WTSD 43.0% */
      'gto': 'gto' as const,
      /** VPIP 52.7%，PFR 20.1%，AF 6.10，WTSD 29.9% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 52.6%，PFR 20.3%，AF 0.47，WTSD 70.7% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 2.80，WTSD 35.1% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 1.37，WTSD 45.9% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 52.6%，PFR 20.0%，AF 4.29，WTSD 29.9% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 6.90，WTSD 26.6% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 5.07，WTSD 28.1% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 0.92，WTSD 59.1% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 52.5%，PFR 20.4%，AF 3.55，WTSD 31.7% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 52.6%，PFR 20.3%，AF 1.65，WTSD 58.3% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 52.7%，PFR 20.3%，AF 2.09，WTSD 38.9% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 0.59，WTSD 61.7% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 52.5%，PFR 20.3%，AF 1.07，WTSD 51.1% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 52.3%，PFR 20.1%，AF 3.24，WTSD 34.4% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 3.99，WTSD 33.0% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 4.73，WTSD 29.8% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 52.5%，PFR 20.1%，AF 6.42，WTSD 27.9% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 1.59，WTSD 50.6% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 52.5%，PFR 20.1%，AF 3.54，WTSD 29.8% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 2.40，WTSD 36.1% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 5.60，WTSD 28.8% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 52.4%，PFR 20.4%，AF 1.70，WTSD 43.8% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 6.67，WTSD 27.3% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 5.37，WTSD 30.6% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 52.7%，PFR 20.1%，AF 5.67，WTSD 26.7% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 2.98，WTSD 33.1% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 2.18，WTSD 36.3% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 3.78，WTSD 30.5% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 4.54，WTSD 31.8% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 52.3%，PFR 20.3%，AF 1.90，WTSD 40.6% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 52.5%，PFR 20.1%，AF 6.11，WTSD 27.2% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 52.6%，PFR 20.3%，AF 0.52，WTSD 65.8% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 52.6%，PFR 20.1%，AF 3.29，WTSD 31.2% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 4.06，WTSD 30.4% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 1.11，WTSD 55.0% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 52.5%，PFR 20.1%，AF 4.53，WTSD 29.1% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 52.7%，PFR 20.2%，AF 1.25，WTSD 48.6% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 52.7%，PFR 20.3%，AF 4.94，WTSD 29.2% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 52.5%，PFR 20.2%，AF 2.67，WTSD 37.8% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 52.6%，PFR 20.2%，AF 2.64，WTSD 34.0% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '7-9p': {
      /** VPIP 41.4%，PFR 12.8%，AF 1.60，WTSD 42.8% */
      'gto': 'gto' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 5.50，WTSD 31.9% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 0.38，WTSD 71.0% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 2.60，WTSD 36.1% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 1.25，WTSD 46.2% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 4.09，WTSD 31.5% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 41.5%，PFR 12.8%，AF 6.34，WTSD 29.0% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 4.77，WTSD 30.3% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 0.81，WTSD 58.6% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 41.1%，PFR 12.8%，AF 3.31，WTSD 32.8% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 1.53，WTSD 56.5% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 1.95，WTSD 39.5% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 0.49，WTSD 62.0% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 40.8%，PFR 12.9%，AF 0.98，WTSD 51.4% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 41.4%，PFR 13.0%，AF 2.93，WTSD 36.1% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 3.67，WTSD 34.4% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 4.39，WTSD 31.6% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 5.84，WTSD 30.4% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 1.45，WTSD 49.5% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 3.30，WTSD 31.9% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 41.2%，PFR 12.8%，AF 2.27，WTSD 37.0% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 5.12，WTSD 30.7% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 41.1%，PFR 12.9%，AF 1.57，WTSD 44.2% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 6.05，WTSD 29.8% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 4.89，WTSD 32.5% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 5.38，WTSD 29.1% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 2.85，WTSD 34.2% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 2.06，WTSD 37.5% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 3.58，WTSD 32.0% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 41.4%，PFR 12.8%，AF 4.17，WTSD 33.4% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 41.0%，PFR 12.9%，AF 1.77，WTSD 40.9% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 5.61，WTSD 29.5% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 0.43，WTSD 65.6% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 41.2%，PFR 12.7%，AF 3.19，WTSD 32.5% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 3.80，WTSD 32.0% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 1.00，WTSD 54.6% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 41.4%，PFR 12.7%，AF 4.21，WTSD 31.0% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 1.15，WTSD 48.7% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 41.4%，PFR 12.7%，AF 4.57，WTSD 30.9% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 41.3%，PFR 12.7%，AF 2.49，WTSD 38.1% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 41.3%，PFR 12.8%，AF 2.55，WTSD 34.8% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
  },
  '3-0': {
    '2-3p': {},
    '4-6p': {
      /** VPIP 36.3%，PFR 18.3%，AF 1.86，WTSD 48.6% */
      'gto': 'gto' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 6.09，WTSD 35.2% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 36.2%，PFR 18.2%，AF 0.61，WTSD 73.6% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 2.81，WTSD 41.7% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 1.53，WTSD 51.1% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 4.20，WTSD 35.4% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 6.65，WTSD 31.5% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 36.4%，PFR 18.4%，AF 4.98，WTSD 33.4% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 36.2%，PFR 18.2%，AF 1.08，WTSD 63.4% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 3.52，WTSD 37.2% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 1.72，WTSD 65.1% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 36.2%，PFR 18.2%，AF 2.19，WTSD 45.2% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 36.2%，PFR 18.2%，AF 0.74，WTSD 66.2% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 36.1%，PFR 18.3%，AF 1.25，WTSD 55.5% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 36.2%，PFR 18.4%，AF 3.20，WTSD 41.8% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 36.3%，PFR 18.4%，AF 3.96，WTSD 39.3% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 36.4%，PFR 18.3%，AF 4.70，WTSD 35.1% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 6.30，WTSD 32.7% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 1.71，WTSD 57.1% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 3.56，WTSD 34.6% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 2.48，WTSD 42.2% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 5.55，WTSD 33.9% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 36.0%，PFR 18.3%，AF 1.80，WTSD 50.6% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 36.3%，PFR 18.2%，AF 6.44，WTSD 31.8% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 5.35，WTSD 36.2% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 36.3%，PFR 18.2%，AF 5.54，WTSD 31.3% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 3.02，WTSD 38.8% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 36.4%，PFR 18.3%，AF 2.26，WTSD 42.3% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 3.66，WTSD 36.3% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 4.50，WTSD 37.7% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 36.1%，PFR 18.4%，AF 1.94，WTSD 46.4% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 5.95，WTSD 32.1% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 36.1%，PFR 18.2%，AF 0.67，WTSD 69.6% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 36.4%，PFR 18.4%，AF 3.23，WTSD 37.2% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 3.95，WTSD 36.1% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 36.3%，PFR 18.3%，AF 1.27，WTSD 60.2% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 36.3%，PFR 18.2%，AF 4.38，WTSD 34.3% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 36.4%，PFR 18.3%，AF 1.42，WTSD 53.5% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 4.87，WTSD 34.2% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 2.72，WTSD 44.7% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 36.2%，PFR 18.3%，AF 2.68，WTSD 40.1% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '7-9p': {
      /** VPIP 24.2%，PFR 12.2%，AF 1.85，WTSD 49.3% */
      'gto': 'gto' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 6.03，WTSD 37.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 0.59，WTSD 74.9% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 24.2%，PFR 12.1%，AF 2.83，WTSD 43.2% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 1.53，WTSD 51.9% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 4.24，WTSD 37.6% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 6.75，WTSD 33.9% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 5.03，WTSD 35.9% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 1.06，WTSD 64.3% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 3.52，WTSD 38.3% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 1.70，WTSD 65.4% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 2.18，WTSD 46.5% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 0.72，WTSD 67.0% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 24.1%，PFR 12.3%，AF 1.25，WTSD 56.6% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 24.2%，PFR 12.2%，AF 3.22，WTSD 42.3% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 24.2%，PFR 12.1%，AF 3.96，WTSD 41.0% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 4.67，WTSD 37.8% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 6.40，WTSD 35.3% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 1.70，WTSD 57.4% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 3.67，WTSD 36.5% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 2.47，WTSD 43.7% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 5.63，WTSD 36.2% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 23.9%，PFR 12.1%，AF 1.82，WTSD 50.8% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 6.64，WTSD 34.6% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 5.41，WTSD 38.5% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 5.47，WTSD 34.2% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 2.99，WTSD 40.8% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 2.26，WTSD 43.4% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 3.74，WTSD 38.1% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 4.55，WTSD 39.7% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 24.2%，PFR 12.2%，AF 1.99，WTSD 46.8% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 24.2%，PFR 12.1%，AF 5.97，WTSD 34.8% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 0.65，WTSD 70.5% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 3.30，WTSD 38.7% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 4.01，WTSD 38.1% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 1.26，WTSD 60.8% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 4.41，WTSD 36.6% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 1.43，WTSD 54.2% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 4.88，WTSD 36.2% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 24.3%，PFR 12.1%，AF 2.72，WTSD 45.9% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 24.3%，PFR 12.2%，AF 2.66，WTSD 41.5% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
  },
  '3-50': {
    '2-3p': {},
    '4-6p': {
      /** VPIP 41.1%，PFR 20.2%，AF 1.83，WTSD 48.2% */
      'gto': 'gto' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 5.88，WTSD 36.6% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 0.57，WTSD 73.2% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 2.80，WTSD 41.9% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 1.48，WTSD 50.7% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 4.16，WTSD 36.7% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 6.51，WTSD 32.9% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 4.90，WTSD 34.5% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 41.1%，PFR 20.3%，AF 1.04，WTSD 62.8% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 41.1%，PFR 20.3%，AF 3.44，WTSD 38.4% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 1.71，WTSD 63.7% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 2.19，WTSD 45.1% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 0.68，WTSD 65.8% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 41.0%，PFR 20.3%，AF 1.20，WTSD 55.3% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 41.1%，PFR 20.4%，AF 3.14，WTSD 41.2% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 3.94，WTSD 40.0% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 4.70，WTSD 36.2% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 6.05，WTSD 34.8% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 41.2%，PFR 20.2%，AF 1.68，WTSD 56.5% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 3.42，WTSD 35.4% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 2.47，WTSD 42.3% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 5.47，WTSD 35.6% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 41.0%，PFR 20.4%，AF 1.81，WTSD 49.8% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 41.3%，PFR 20.2%，AF 6.26，WTSD 33.6% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 5.22，WTSD 37.5% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 5.35，WTSD 33.0% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 2.97，WTSD 39.8% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 2.22，WTSD 42.1% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 41.1%，PFR 20.3%，AF 3.72，WTSD 37.0% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 4.39，WTSD 39.1% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 41.0%，PFR 20.2%，AF 1.99，WTSD 45.2% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 5.81，WTSD 33.6% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 41.2%，PFR 20.2%，AF 0.62，WTSD 69.1% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 41.3%，PFR 20.4%，AF 3.23，WTSD 37.6% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 3.96，WTSD 37.0% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 1.24，WTSD 59.4% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 41.2%，PFR 20.2%，AF 4.35，WTSD 35.4% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 41.3%，PFR 20.3%，AF 1.38，WTSD 53.2% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 41.1%，PFR 20.2%，AF 4.74，WTSD 35.3% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 41.1%，PFR 20.3%，AF 2.74，WTSD 44.5% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 41.2%，PFR 20.3%，AF 2.66，WTSD 40.1% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
    '7-9p': {
      /** VPIP 29.5%，PFR 14.1%，AF 1.80，WTSD 49.8% */
      'gto': 'gto' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 5.60，WTSD 40.1% */
      'af5.1-wtsd50': 'af5.1-wtsd50' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 0.54，WTSD 74.5% */
      'af0.5-wtsd79': 'af0.5-wtsd79' as const,
      /** VPIP 29.6%，PFR 14.1%，AF 2.74，WTSD 44.3% */
      'af2.6-wtsd53': 'af2.6-wtsd53' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 1.46，WTSD 52.4% */
      'af1.3-wtsd59': 'af1.3-wtsd59' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 4.13，WTSD 39.6% */
      'af3.8-wtsd49': 'af3.8-wtsd49' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 6.34，WTSD 36.5% */
      'af5.8-wtsd46': 'af5.8-wtsd46' as const,
      /** VPIP 29.4%，PFR 14.2%，AF 4.77，WTSD 37.9% */
      'af4.5-wtsd47': 'af4.5-wtsd47' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 1.01，WTSD 64.2% */
      'af0.9-wtsd70': 'af0.9-wtsd70' as const,
      /** VPIP 29.3%，PFR 14.1%，AF 3.37，WTSD 40.5% */
      'af3.2-wtsd49': 'af3.2-wtsd49' as const,
      /** VPIP 29.4%，PFR 14.2%，AF 1.65，WTSD 65.1% */
      'af1.5-wtsd70': 'af1.5-wtsd70' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 2.13，WTSD 47.0% */
      'af2.0-wtsd55': 'af2.0-wtsd55' as const,
      /** VPIP 29.5%，PFR 14.2%，AF 0.66，WTSD 67.0% */
      'af0.6-wtsd72': 'af0.6-wtsd72' as const,
      /** VPIP 29.4%，PFR 14.1%，AF 1.19，WTSD 57.4% */
      'af1.1-wtsd63': 'af1.1-wtsd63' as const,
      /** VPIP 29.6%，PFR 14.3%，AF 3.09，WTSD 44.4% */
      'af2.9-wtsd53': 'af2.9-wtsd53' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 3.77，WTSD 42.9% */
      'af3.5-wtsd52': 'af3.5-wtsd52' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 4.48，WTSD 39.8% */
      'af4.1-wtsd49': 'af4.1-wtsd49' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 5.81，WTSD 38.5% */
      'af5.4-wtsd48': 'af5.4-wtsd48' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 1.64，WTSD 57.2% */
      'af1.5-wtsd64': 'af1.5-wtsd64' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 3.36，WTSD 38.4% */
      'af3.4-wtsd45': 'af3.4-wtsd45' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 2.45，WTSD 44.3% */
      'af2.3-wtsd52': 'af2.3-wtsd52' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 5.17，WTSD 38.9% */
      'af4.8-wtsd48': 'af4.8-wtsd48' as const,
      /** VPIP 29.4%，PFR 14.2%，AF 1.75，WTSD 51.0% */
      'af1.6-wtsd59': 'af1.6-wtsd59' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 6.02，WTSD 37.5% */
      'af5.6-wtsd47': 'af5.6-wtsd47' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 4.93，WTSD 41.1% */
      'af4.6-wtsd50': 'af4.6-wtsd50' as const,
      /** VPIP 29.5%，PFR 14.2%，AF 5.34，WTSD 36.7% */
      'af5.0-wtsd46': 'af5.0-wtsd46' as const,
      /** VPIP 29.6%，PFR 14.1%，AF 2.96，WTSD 42.1% */
      'af2.8-wtsd50': 'af2.8-wtsd50' as const,
      /** VPIP 29.5%，PFR 14.2%，AF 2.20，WTSD 44.6% */
      'af2.1-wtsd52': 'af2.1-wtsd52' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 3.59，WTSD 40.1% */
      'af3.4-wtsd49': 'af3.4-wtsd49' as const,
      /** VPIP 29.6%，PFR 14.1%，AF 4.26，WTSD 41.9% */
      'af3.9-wtsd51': 'af3.9-wtsd51' as const,
      /** VPIP 29.3%，PFR 14.2%，AF 1.94，WTSD 47.6% */
      'af1.8-wtsd55': 'af1.8-wtsd55' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 5.60，WTSD 37.4% */
      'af5.2-wtsd47': 'af5.2-wtsd47' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 0.60，WTSD 70.3% */
      'af0.5-wtsd75': 'af0.5-wtsd75' as const,
      /** VPIP 29.6%，PFR 14.1%，AF 3.22，WTSD 40.2% */
      'af3.0-wtsd48': 'af3.0-wtsd48' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 3.87，WTSD 40.1% */
      'af3.6-wtsd49': 'af3.6-wtsd49' as const,
      /** VPIP 29.6%，PFR 14.1%，AF 1.21，WTSD 60.3% */
      'af1.1-wtsd67': 'af1.1-wtsd67' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 4.22，WTSD 38.8% */
      'af4.0-wtsd48': 'af4.0-wtsd48' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 1.35，WTSD 54.6% */
      'af1.2-wtsd61': 'af1.2-wtsd61' as const,
      /** VPIP 29.5%，PFR 14.1%，AF 4.60，WTSD 38.7% */
      'af4.3-wtsd48': 'af4.3-wtsd48' as const,
      /** VPIP 29.6%，PFR 14.2%，AF 2.62，WTSD 46.9% */
      'af2.5-wtsd55': 'af2.5-wtsd55' as const,
      /** VPIP 29.5%，PFR 14.2%，AF 2.65，WTSD 42.4% */
      'af2.5-wtsd50': 'af2.5-wtsd50' as const,
    },
  },
} as const

/**
 * 全量翻前策略档位名称（所有格式/人数范围共享相同名称集合）
 */
export type PreflopProfileName =
  'gto'
  | 'vpip80-pfr16'
  | 'vpip20-pfr10'
  | 'vpip69-pfr53'
  | 'vpip47-pfr28'
  | 'vpip60-pfr12'
  | 'vpip79-pfr36'
  | 'vpip41-pfr10'
  | 'vpip60-pfr39'
  | 'vpip33-pfr23'
  | 'vpip64-pfr25'
  | 'vpip31-pfr11'
  | 'vpip50-pfr19'
  | 'vpip70-pfr39'
  | 'vpip68-pfr7'
  | 'vpip25-pfr18'
  | 'vpip72-pfr30'
  | 'vpip52-pfr37'
  | 'vpip41-pfr20'
  | 'vpip70-pfr20'
  | 'vpip35-pfr30'
  | 'vpip78-pfr23'
  | 'vpip58-pfr29'
  | 'vpip61-pfr46'
  | 'vpip48-pfr11'
  | 'vpip37-pfr15'
  | 'vpip63-pfr17'
  | 'vpip69-pfr13'
  | 'vpip58-pfr22'
  | 'vpip64-pfr34'
  | 'vpip75-pfr43'
  | 'vpip54-pfr15'
  | 'vpip42-pfr29'
  | 'vpip69-pfr47'
  | 'vpip53-pfr26'
  | 'vpip31-pfr16'
  | 'vpip25-pfr8'
  | 'vpip47-pfr34'
  | 'vpip47-pfr23'
  | 'vpip64-pfr42'
  | 'vpip75-pfr14'
  | 'vpip57-pfr43'
  | 'vpip55-pfr35'
  | 'vpip69-pfr28'
  | 'vpip45-pfr17'
  | 'vpip36-pfr25'
  | 'vpip25-pfr14'
  | 'vpip37-pfr9'
  | 'vpip74-pfr21'
  | 'vpip43-pfr25'
  | 'vpip67-pfr37'
  | 'vpip54-pfr11'
  | 'vpip43-pfr13'
  | 'vpip28-pfr20'
  | 'vpip40-pfr16'
  | 'vpip22-pfr16'
  | 'vpip37-pfr18'
  | 'vpip49-pfr14'
  | 'vpip45-pfr32'
  | 'vpip50-pfr30'
  | 'vpip38-pfr23'

/**
 * 全量翻后策略档位名称（所有格式/人数范围共享相同名称集合）
 */
export type PostflopProfileName =
  'gto'
  | 'af5.1-wtsd50'
  | 'af0.5-wtsd79'
  | 'af2.6-wtsd53'
  | 'af1.3-wtsd59'
  | 'af3.8-wtsd49'
  | 'af5.8-wtsd46'
  | 'af4.5-wtsd47'
  | 'af0.9-wtsd70'
  | 'af3.2-wtsd49'
  | 'af1.5-wtsd70'
  | 'af2.0-wtsd55'
  | 'af0.6-wtsd72'
  | 'af1.1-wtsd63'
  | 'af2.9-wtsd53'
  | 'af3.5-wtsd52'
  | 'af4.1-wtsd49'
  | 'af5.4-wtsd48'
  | 'af1.5-wtsd64'
  | 'af3.4-wtsd45'
  | 'af2.3-wtsd52'
  | 'af4.8-wtsd48'
  | 'af1.6-wtsd59'
  | 'af5.6-wtsd47'
  | 'af4.6-wtsd50'
  | 'af5.0-wtsd46'
  | 'af2.8-wtsd50'
  | 'af2.1-wtsd52'
  | 'af3.4-wtsd49'
  | 'af3.9-wtsd51'
  | 'af1.8-wtsd55'
  | 'af5.2-wtsd47'
  | 'af0.5-wtsd75'
  | 'af3.0-wtsd48'
  | 'af3.6-wtsd49'
  | 'af1.1-wtsd67'
  | 'af4.0-wtsd48'
  | 'af1.2-wtsd61'
  | 'af4.3-wtsd48'
  | 'af2.5-wtsd55'
  | 'af2.5-wtsd50'

/**
 * 所有策略档位名称（翻前 + 翻后合集）
 */
export type StrategyProfileName = PreflopProfileName | PostflopProfileName

/**
 * 全量翻前档位集合（用于运行时校验）
 */
export const ALL_PREFLOP_PROFILES: Set<string> = new Set([
  'gto',
  'vpip80-pfr16',
  'vpip20-pfr10',
  'vpip69-pfr53',
  'vpip47-pfr28',
  'vpip60-pfr12',
  'vpip79-pfr36',
  'vpip41-pfr10',
  'vpip60-pfr39',
  'vpip33-pfr23',
  'vpip64-pfr25',
  'vpip31-pfr11',
  'vpip50-pfr19',
  'vpip70-pfr39',
  'vpip68-pfr7',
  'vpip25-pfr18',
  'vpip72-pfr30',
  'vpip52-pfr37',
  'vpip41-pfr20',
  'vpip70-pfr20',
  'vpip35-pfr30',
  'vpip78-pfr23',
  'vpip58-pfr29',
  'vpip61-pfr46',
  'vpip48-pfr11',
  'vpip37-pfr15',
  'vpip63-pfr17',
  'vpip69-pfr13',
  'vpip58-pfr22',
  'vpip64-pfr34',
  'vpip75-pfr43',
  'vpip54-pfr15',
  'vpip42-pfr29',
  'vpip69-pfr47',
  'vpip53-pfr26',
  'vpip31-pfr16',
  'vpip25-pfr8',
  'vpip47-pfr34',
  'vpip47-pfr23',
  'vpip64-pfr42',
  'vpip75-pfr14',
  'vpip57-pfr43',
  'vpip55-pfr35',
  'vpip69-pfr28',
  'vpip45-pfr17',
  'vpip36-pfr25',
  'vpip25-pfr14',
  'vpip37-pfr9',
  'vpip74-pfr21',
  'vpip43-pfr25',
  'vpip67-pfr37',
  'vpip54-pfr11',
  'vpip43-pfr13',
  'vpip28-pfr20',
  'vpip40-pfr16',
  'vpip22-pfr16',
  'vpip37-pfr18',
  'vpip49-pfr14',
  'vpip45-pfr32',
  'vpip50-pfr30',
  'vpip38-pfr23',
])

/**
 * 全量翻后档位集合（用于运行时校验）
 */
export const ALL_POSTFLOP_PROFILES: Set<string> = new Set([
  'gto',
  'af5.1-wtsd50',
  'af0.5-wtsd79',
  'af2.6-wtsd53',
  'af1.3-wtsd59',
  'af3.8-wtsd49',
  'af5.8-wtsd46',
  'af4.5-wtsd47',
  'af0.9-wtsd70',
  'af3.2-wtsd49',
  'af1.5-wtsd70',
  'af2.0-wtsd55',
  'af0.6-wtsd72',
  'af1.1-wtsd63',
  'af2.9-wtsd53',
  'af3.5-wtsd52',
  'af4.1-wtsd49',
  'af5.4-wtsd48',
  'af1.5-wtsd64',
  'af3.4-wtsd45',
  'af2.3-wtsd52',
  'af4.8-wtsd48',
  'af1.6-wtsd59',
  'af5.6-wtsd47',
  'af4.6-wtsd50',
  'af5.0-wtsd46',
  'af2.8-wtsd50',
  'af2.1-wtsd52',
  'af3.4-wtsd49',
  'af3.9-wtsd51',
  'af1.8-wtsd55',
  'af5.2-wtsd47',
  'af0.5-wtsd75',
  'af3.0-wtsd48',
  'af3.6-wtsd49',
  'af1.1-wtsd67',
  'af4.0-wtsd48',
  'af1.2-wtsd61',
  'af4.3-wtsd48',
  'af2.5-wtsd55',
  'af2.5-wtsd50',
])

/**
 * 翻前档位集合（按盲注结构 + 人数范围，用于精确校验）
 */
export const PREFLOP_PROFILE_SET_BY_FORMAT: {
  [F in GameFormat]?: { [R in SeatRange]?: Set<string> }
} = {
  '2-0': {
    '2-3p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '4-6p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '7-9p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
  },
  '2-50': {
    '2-3p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '4-6p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '7-9p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
  },
  '2-100': {
    '2-3p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '4-6p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '7-9p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
  },
  '3-0': {
    '2-3p': new Set(),
    '4-6p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '7-9p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
  },
  '3-50': {
    '2-3p': new Set(),
    '4-6p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
    '7-9p': new Set(['gto', 'vpip80-pfr16', 'vpip20-pfr10', 'vpip69-pfr53', 'vpip47-pfr28', 'vpip60-pfr12', 'vpip79-pfr36', 'vpip41-pfr10', 'vpip60-pfr39', 'vpip33-pfr23', 'vpip64-pfr25', 'vpip31-pfr11', 'vpip50-pfr19', 'vpip70-pfr39', 'vpip68-pfr7', 'vpip25-pfr18', 'vpip72-pfr30', 'vpip52-pfr37', 'vpip41-pfr20', 'vpip70-pfr20', 'vpip35-pfr30', 'vpip78-pfr23', 'vpip58-pfr29', 'vpip61-pfr46', 'vpip48-pfr11', 'vpip37-pfr15', 'vpip63-pfr17', 'vpip69-pfr13', 'vpip58-pfr22', 'vpip64-pfr34', 'vpip75-pfr43', 'vpip54-pfr15', 'vpip42-pfr29', 'vpip69-pfr47', 'vpip53-pfr26', 'vpip31-pfr16', 'vpip25-pfr8', 'vpip47-pfr34', 'vpip47-pfr23', 'vpip64-pfr42', 'vpip75-pfr14', 'vpip57-pfr43', 'vpip55-pfr35', 'vpip69-pfr28', 'vpip45-pfr17', 'vpip36-pfr25', 'vpip25-pfr14', 'vpip37-pfr9', 'vpip74-pfr21', 'vpip43-pfr25', 'vpip67-pfr37', 'vpip54-pfr11', 'vpip43-pfr13', 'vpip28-pfr20', 'vpip40-pfr16', 'vpip22-pfr16', 'vpip37-pfr18', 'vpip49-pfr14', 'vpip45-pfr32', 'vpip50-pfr30', 'vpip38-pfr23']),
  },
}

/**
 * 翻后档位集合（按盲注结构 + 人数范围，用于精确校验）
 */
export const POSTFLOP_PROFILE_SET_BY_FORMAT: {
  [F in GameFormat]?: { [R in SeatRange]?: Set<string> }
} = {
  '2-0': {
    '2-3p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '4-6p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '7-9p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
  },
  '2-50': {
    '2-3p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '4-6p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '7-9p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
  },
  '2-100': {
    '2-3p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '4-6p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '7-9p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
  },
  '3-0': {
    '2-3p': new Set(),
    '4-6p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '7-9p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
  },
  '3-50': {
    '2-3p': new Set(),
    '4-6p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
    '7-9p': new Set(['gto', 'af5.1-wtsd50', 'af0.5-wtsd79', 'af2.6-wtsd53', 'af1.3-wtsd59', 'af3.8-wtsd49', 'af5.8-wtsd46', 'af4.5-wtsd47', 'af0.9-wtsd70', 'af3.2-wtsd49', 'af1.5-wtsd70', 'af2.0-wtsd55', 'af0.6-wtsd72', 'af1.1-wtsd63', 'af2.9-wtsd53', 'af3.5-wtsd52', 'af4.1-wtsd49', 'af5.4-wtsd48', 'af1.5-wtsd64', 'af3.4-wtsd45', 'af2.3-wtsd52', 'af4.8-wtsd48', 'af1.6-wtsd59', 'af5.6-wtsd47', 'af4.6-wtsd50', 'af5.0-wtsd46', 'af2.8-wtsd50', 'af2.1-wtsd52', 'af3.4-wtsd49', 'af3.9-wtsd51', 'af1.8-wtsd55', 'af5.2-wtsd47', 'af0.5-wtsd75', 'af3.0-wtsd48', 'af3.6-wtsd49', 'af1.1-wtsd67', 'af4.0-wtsd48', 'af1.2-wtsd61', 'af4.3-wtsd48', 'af2.5-wtsd55', 'af2.5-wtsd50']),
  },
}
