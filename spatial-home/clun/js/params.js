/* Clun — 7 South Drive, Wokingham · 参数表
   单位：米。坐标：+X 北、+Y 西、+Z 上；原点 = 中央入口门洞中心、正立面外墙面、一楼完成面。主入口朝东（−Y）。
   可信度（没有任何一项是实测，全表不存在 VERIFIED）：
     STATED     经纪平面图（Fourwalls #105157）上直接标注的数字，图上自注 approximate —— 按 PROVISIONAL 对待
     ESTIMATED  估算。依据写在 basis 里：plan = 按标注房间尺寸换算比例后在平面图上量取（约 ±0.1 m）
                                        photo = 由照片比例推算（约 ±0.3 m）
                                        assumed = 无直接依据的常规做法假设
   改这里的数，模型各模块会跟着变。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var E = 'ESTIMATED', S = 'STATED';
  var PLAN = '平面图 1-8.jpg 量取（≈60 px/m，以 Drawing Room 4.74 m 定比例）';
  var FRONT = '正面照片 1-6.jpg（以主体宽 12.2 m 定比例）';
  var REAR = '背面照片 29-5.jpg / 手册 p19';
  var AIR = 'Vimeo 航拍帧 00:06 + Google Earth GE_01–05';
  var ASM = '常规做法假设';

  /* [键, 值, 说明, 来源, 可信度, 依据类型] */
  var T = C.PARAM_TABLE = [
    /* —— 主体平面 —— */
    ['mainHalfW', 6.10, '主体南北半宽（外墙面到中轴）', PLAN, E, 'plan'],
    ['mainDepth', 6.80, '主体东西进深（南段，外墙面）', PLAN, E, 'plan'],
    ['rearStepX', 1.70, '后墙北段外凸起点 X（其北为后山墙段）', PLAN, E, 'plan'],
    ['rearStep', 0.40, '后墙北段外凸量', PLAN, E, 'plan'],
    ['wallExt', 0.33, '外墙厚', PLAN, E, 'plan'],
    ['wallInt', 0.12, '内隔墙厚（M3 用）', ASM, E, 'assumed'],
    /* —— 标高 —— */
    ['groundZ', -0.30, '室外地面相对一楼完成面', FRONT + '：门廊前约两步台阶', E, 'photo'],
    ['floor1Z', 2.95, '二楼完成面', ASM + '（一楼净高约 2.65 + 楼板 0.30）', E, 'assumed'],
    ['floor2Z', 5.65, '阁楼完成面', ASM + '（二楼净高约 2.40 + 楼板 0.30）', E, 'assumed'],
    ['slabT', 0.30, '楼板结构厚', ASM, E, 'assumed'],
    ['eaveZ', 5.30, '主檐口（外墙面与屋面交线）标高', FRONT + ' / ' + REAR + '：檐口距地约 5.5–5.7', E, 'photo'],
    ['atticCeil', 2.25, '阁楼平顶净高（M3 用）', ASM, E, 'assumed'],
    /* —— 主屋顶 —— */
    ['roofPitch', 47, '主屋顶坡度（度）', FRONT + ' / ' + AIR, E, 'photo'],
    ['roofOvh', 0.35, '檐口出挑（水平）', FRONT, E, 'photo'],
    ['roofVerge', 0.25, '南北山墙端出挑', AIR, E, 'photo'],
    ['roofT', 0.16, '屋面板厚（造型用）', ASM, E, 'assumed'],
    /* —— 正面凸窗（两层通高，斜切式） —— */
    ['bayS', -3.42, '南凸窗中心 X（Drawing Room / Bedroom 2）', PLAN, E, 'plan'],
    ['bayN', 3.76, '北凸窗中心 X（Dining Room / Bedroom 1）', PLAN, E, 'plan'],
    ['bayHalfW', 1.65, '凸窗半宽', PLAN, E, 'plan'],
    ['bayReturn', 0.75, '凸窗直边进深', PLAN, E, 'plan'],
    ['bayCant', 0.90, '凸窗 45° 斜边在两个方向上的投影', PLAN, E, 'plan'],
    /* —— 正面山墙（凸窗之上，挂瓦） —— */
    ['gableHalfW', 2.00, '正面山墙半宽（墙面）', FRONT, E, 'photo'],
    ['gablePitch', 45, '正面山墙屋面坡度（度）', FRONT, E, 'photo'],
    ['gableFaceY', -1.50, '正面山墙墙面位置 Y（挑出于凸窗之上）', FRONT + ' / ' + AIR, E, 'photo'],
    ['gableVerge', 0.40, '正面山墙封檐出挑', FRONT, E, 'photo'],
    /* —— 正面中央老虎窗（楼梯间，斜披顶） —— */
    ['dormHalfW', 1.40, '中央老虎窗半宽', PLAN + '（阁楼楼梯间外凸 2.8 m 宽）', E, 'plan'],
    ['dormFaceY', 0.35, '中央老虎窗窗面 Y', PLAN, E, 'plan'],
    ['dormEaveZ', 6.80, '中央老虎窗檐口标高', FRONT, E, 'photo'],
    ['dormPitch', 24, '中央老虎窗披顶坡度（度）', AIR, E, 'photo'],
    /* —— 背面 —— */
    ['rearGableHalfW', 2.20, '后山墙半宽（北段全宽 4.4 m）', PLAN + ' / ' + REAR, E, 'plan'],
    ['rearDormX', -3.20, '后老虎窗中心 X（Bedroom 4）', PLAN + ' / ' + REAR, E, 'plan'],
    ['rearDormHalfW', 1.10, '后老虎窗半宽', PLAN, E, 'plan'],
    ['rearDormFaceY', 6.00, '后老虎窗窗面 Y', REAR, E, 'photo'],
    ['rearDormEaveZ', 7.40, '后老虎窗檐口标高', REAR, E, 'photo'],
    ['rearDormPitch', 42, '后老虎窗屋面坡度（度）', REAR, E, 'photo'],
    /* —— 门廊（木结构） —— */
    ['porchHalfW', 1.30, '门廊半宽', PLAN, E, 'plan'],
    ['porchProj', 1.50, '门廊前凸', PLAN + ' / ' + AIR, E, 'photo'],
    ['porchPlateZ', 1.66, '门廊檐口（柱顶）标高', FRONT, E, 'photo'],
    ['porchPitch', 46, '门廊屋面坡度（度）', FRONT, E, 'photo'],
    ['stepRise', 0.15, '入口踏步高', ASM, E, 'assumed'],
    /* —— 烟囱 —— */
    ['chimTopZ', 10.75, '主烟囱砖身顶标高（屋脊上约 1.8 m）', FRONT, E, 'photo'],
    ['chimInset', 0.80, '主烟囱中心距山墙外墙面', AIR, E, 'photo'],
    ['chimPotH', 0.45, '烟囱陶罐高', FRONT, E, 'photo'],
    /* —— 北侧厨房扩建（单层 + 坡屋顶） —— */
    ['kitX1', 10.90, '厨房扩建北外墙面 X', PLAN, E, 'plan'],
    ['kitY0', 0.53, '厨房扩建东外墙面 Y（比主体正面后退）', PLAN, E, 'plan'],
    ['kitY1', 7.20, '厨房扩建西外墙面 Y', PLAN, E, 'plan'],
    ['kitEaveZ', 2.35, '厨房扩建檐口标高', FRONT, E, 'photo'],
    ['kitPitch', 40, '厨房扩建屋面坡度（度）', FRONT + ' / ' + REAR, E, 'photo'],
    ['kitHipPitch', 48, '厨房扩建北端斜脊面坡度（度）', FRONT, E, 'photo'],
    ['kitBayX', 8.50, '厨房正面凸窗中心 X', PLAN, E, 'plan'],
    ['kitBayHalfW', 1.30, '厨房正面凸窗半宽', PLAN, E, 'plan'],
    ['kitBayReturn', 0.77, '厨房正面凸窗直边进深', PLAN, E, 'plan'],
    ['kitBayCant', 0.68, '厨房正面凸窗斜边投影', PLAN, E, 'plan'],
    ['kitChimX', 9.10, '厨房烟囱中心 X（照片位置；与平面图北墙烟囱垛不一致，见 README）', FRONT + ' / ' + REAR, E, 'photo'],
    ['kitChimTopZ', 5.95, '厨房烟囱砖身顶标高', FRONT, E, 'photo'],
    ['kitRearBayX0', 7.30, '厨房后玻璃凸间南边 X', PLAN, E, 'plan'],
    ['kitRearBayX1', 9.75, '厨房后玻璃凸间北边 X', PLAN, E, 'plan'],
    ['kitRearBayProj', 1.40, '厨房后玻璃凸间外凸', PLAN, E, 'plan'],
    /* —— 西南阳光房（玻璃顶） —— */
    ['sunX0', -5.80, '阳光房南外墙面 X', PLAN, E, 'plan'],
    ['sunX1', -1.16, '阳光房北外墙面 X', PLAN, E, 'plan'],
    ['sunProj', 3.80, '阳光房自后墙外凸', PLAN, E, 'plan'],
    ['sunDwarfZ', 0.55, '阳光房矮砖墙顶标高', REAR, E, 'photo'],
    ['sunEaveZ', 2.35, '阳光房檐口标高', REAR, E, 'photo'],
    ['sunPitch', 28, '阳光房玻璃顶坡度（度）', REAR, E, 'photo']
  ];
  var P = C.P = {};
  T.forEach(function (r) { P[r[0]] = r[1]; });

  /* 平面图上标注的房间尺寸（STATED / PROVISIONAL）。2026-11-14 对照包内 1-8_floorplan.jpg 与在线原图逐项复核，数字一致。 */
  C.ROOMS = [
    ['G', 'Drawing Room', 6.18, 4.74, '南'], ['G', 'Dining Room', 5.35, 4.02, '北'], ['G', 'Snug', 4.56, 2.90, '西'],
    ['G', 'Kitchen / Breakfast Room', 6.04, 4.20, '北扩建'], ['G', 'Sun Room', 4.05, 3.52, '西南'],
    ['1', 'Bedroom 1', 5.35, 4.03, '北'], ['1', 'Bedroom 2', 4.85, 4.75, '南'], ['1', 'Study', 4.75, 3.00, '西南'],
    ['2', 'Bedroom 3', 4.01, 3.69, '北'], ['2', 'Bedroom 4', 4.76, 3.67, '南']
  ];
  C.AREA = { main: 267.6, outbuilding: 50.1, total: 317.7, conf: S + ' · PROVISIONAL', note: '房产口径（RICS PM 2nd，含檐下空间，图注 approximate）' };
})();
