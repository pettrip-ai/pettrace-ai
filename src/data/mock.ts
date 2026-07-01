import type { CityId, CityMeta, Place, PlaceCategory, PetFriendlyRule } from './types'

const todayISO = () => new Date().toISOString()

const makeRule = (overrides: Partial<PetFriendlyRule> = {}): PetFriendlyRule => ({
  sizeLimit: 'any',
  allowIndoor: false,
  leashRequired: true,
  fee: 0,
  hasOutdoorSeat: false,
  notes: '',
  ...overrides,
})

const verifier = (base = 8, jitter = 4) => Math.max(1, Math.round(base + Math.random() * jitter))
const score = (base = 0.85, spread = 0.12) =>
  Number((Math.min(1, Math.max(0, base + (Math.random() - 0.5) * spread))).toFixed(2))

const lastVerified = (daysAgo = 14) => {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString()
}

// 上海中心 31.23, 121.47；北京 39.90, 116.40；广州 23.13, 113.26；成都 30.66, 104.06
// 每个城市构造 12 个点，围绕中心在约 ±0.03~0.05 范围内均匀分布
const cityLayouts: Record<CityId, { name: string; center: [number, number]; zoom: number }> = {
  shanghai: { name: '上海', center: [31.23, 121.47], zoom: 13 },
  beijing: { name: '北京', center: [39.90, 116.40], zoom: 13 },
  guangzhou: { name: '广州', center: [23.13, 113.26], zoom: 13 },
  chengdu: { name: '成都', center: [30.66, 104.06], zoom: 13 },
}

const placementsByCity: Record<CityId, Array<[PlaceCategory, string, string, PetFriendlyRule, number, number, number]>> = {
  shanghai: [
    ['pet_park', '静安公园宠物友好区', '静安区南京西路1686号', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '需牵绳、及时清理，周末限流' }), 0.045, 0.010, 4.7],
    ['restaurant', '沪小胖音乐花园餐厅', '黄浦区西藏中路288号2层', makeRule({ sizeLimit: 'medium', allowIndoor: false, hasOutdoorSeat: true, fee: 0, notes: '户外草坪允许小型/中型犬，不可进室内' }), -0.030, 0.025, 4.5],
    ['cafe', 'Manner Coffee(愚园路店)', '长宁区愚园路1088号', makeRule({ sizeLimit: 'small', allowIndoor: false, hasOutdoorSeat: true, notes: '户外露台可带猫犬，需戴胸背' }), 0.015, -0.040, 4.3],
    ['hotel', '上海和平饭店·花园露台', '黄浦区南京东路20号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 80, notes: '需提前预约宠物房，每天清理费 80' }), -0.005, -0.018, 4.6],
    ['park', '世纪公园(1号门宠物通道)', '浦东新区锦绣路1001号', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '非花期草坪可进入，禁止进入花卉区' }), 0.030, 0.030, 4.6],
    ['mall', '兴业太古汇(南京西路店)', '静安区南京西路1788号', makeRule({ sizeLimit: 'small', allowIndoor: false, notes: '仅服务犬可入室内，其它宠物需放宠物推车' }), 0.022, 0.012, 4.1],
    ['scenic_spot', '外滩观光平台(宠物通道)', '黄浦区中山东一路', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '人多时需抱或置于推车，注意台阶' }), -0.040, 0.010, 4.4],
    ['restaurant', 'Bunny Drop 兔子主题餐厅', '徐汇区衡山路700号', makeRule({ sizeLimit: 'any', allowIndoor: true, notes: '自家兔子互动区，禁带其它兔子以防疾病' }), -0.012, -0.030, 4.6],
    ['cafe', 'Seesaw Coffee(滨江店)', '徐汇区龙腾大道', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '滨江户外区犬友好，需牵绳' }), -0.020, -0.010, 4.2],
    ['hotel', '上海外滩华尔道夫酒店', '黄浦区中山东一路2号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 150, notes: '宠物套房数量有限，提前三周预约' }), -0.038, 0.022, 4.7],
    ['park', '鲁迅公园(北部草坪)', '虹口区四川北路2288号', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '早 9 点前可自由奔跑区' }), 0.038, 0.005, 4.5],
    ['pet_park', '嘉怡路宠物公园', '嘉定区江桥镇', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '分大型犬区与小型犬区' }), 0.050, -0.045, 4.6],
  ],
  beijing: [
    ['park', '朝阳公园·南部遛狗区', '朝阳区朝阳公园南路1号', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '草坪分时段开放，早 7-9 自由奔跑' }), 0.045, 0.025, 4.6],
    ['restaurant', 'TRB Hutong 胡同餐厅', '东城区沙滩北街23号', makeRule({ sizeLimit: 'any', allowIndoor: false, hasOutdoorSeat: true, notes: '庭院区可带宠，室内谢绝' }), 0.010, -0.040, 4.5],
    ['cafe', 'Coffee% 景山前街店', '东城区景山前街12号', makeRule({ sizeLimit: 'small', hasOutdoorSeat: true, notes: '户外露台可带小型犬，猫需装包' }), 0.020, -0.010, 4.3],
    ['hotel', '北京什刹海紫檀酒店', '西城区烟袋斜街甲5号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 100, notes: '胡同四合院，需签宠物协议' }), -0.015, -0.020, 4.7],
    ['scenic_spot', '景山公园外东侧步道', '西城区景山西街', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '景区内部禁止，外围步道可遛' }), 0.010, -0.025, 4.4],
    ['pet_park', '东小口森林公园宠物区', '昌平区立水桥', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '有沙地区，自备洗澡设备' }), 0.050, -0.015, 4.5],
    ['mall', '三里屯太古里北区', '朝阳区三里屯路19号', makeRule({ sizeLimit: 'small', allowIndoor: false, notes: '商场室内仅导盲犬，户外广场可带' }), 0.028, 0.035, 4.2],
    ['restaurant', '京兆尹·东方花园店', '东城区金宝街88号', makeRule({ sizeLimit: 'medium', hasOutdoorSeat: true, notes: '素食花园，犬友好' }), 0.005, 0.022, 4.5],
    ['cafe', 'Wood & Co 751店', '朝阳区798艺术区751D区', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '工厂风户外，周末人多' }), 0.040, 0.040, 4.3],
    ['park', '奥森南园运动草坪', '朝阳区北辰东路15号', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '跑步区牵绳，封闭草坪可放开' }), 0.038, 0.012, 4.6],
    ['hotel', '北京瑰丽酒店', '东城区东三环北路1号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 200, notes: '宠物套房自带清洁设备' }), 0.030, 0.005, 4.8],
    ['scenic_spot', '什刹海外围步道', '西城区什刹海周边', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '请勿靠近冰面、荷花池' }), -0.008, -0.032, 4.4],
  ],
  guangzhou: [
    ['restaurant', '泮溪酒家·湖边亭', '荔湾区龙津西路151号', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '园林湖畔可带宠，室内需寄存' }), -0.010, -0.030, 4.4],
    ['park', '越秀公园·东秀湖周边', '越秀区解放北路', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '靠近南门草坪区域可遛' }), 0.008, -0.010, 4.5],
    ['pet_park', '广州海珠湿地公园宠物区', '海珠区新滘中路', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '需自带水和食物，不能进入湿地栈道' }), -0.028, 0.035, 4.5],
    ['cafe', '太平洋咖啡(太古汇店)', '天河区天河路383号', makeRule({ sizeLimit: 'small', allowIndoor: false, hasOutdoorSeat: true, notes: '户外桌可带小型犬，猫需猫包' }), 0.015, 0.020, 4.2],
    ['hotel', '广州文华东方酒店', '天河区天河路385号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 120, notes: '宠物套房，需提前两周' }), 0.012, 0.025, 4.7],
    ['mall', '天河城·户外广场', '天河区天河路208号', makeRule({ sizeLimit: 'small', allowIndoor: false, notes: '室内仅导盲犬，广场可溜' }), 0.025, 0.002, 4.1],
    ['scenic_spot', '白云山南门山麓步道', '白云区广园中路', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '缆车内部禁止宠物，外围步道可' }), 0.040, -0.020, 4.4],
    ['restaurant', '广式茶餐厅·竹溪', '天河区天河路351号', makeRule({ sizeLimit: 'medium', hasOutdoorSeat: true, notes: '露天茶座带宠友好' }), 0.002, 0.012, 4.3],
    ['cafe', 'Starbucks(珠江新城)', '天河区珠江新城', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '户外桌椅区可带，室内禁' }), -0.020, 0.018, 4.2],
    ['park', '珠江公园', '天河区珠江新城', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '晨练时段牵绳可入' }), -0.010, 0.022, 4.5],
    ['pet_park', '番禺区汉溪大道宠物公园', '番禺区汉溪大道中', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '分大小犬区，有沙坑' }), -0.045, 0.045, 4.5],
    ['hotel', '广州四季酒店', '天河区珠江新城', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 150, notes: '贵宾套房可带 1 只中型以下' }), -0.015, 0.028, 4.7],
  ],
  chengdu: [
    ['restaurant', '陈麻婆豆腐·青华路店', '青羊区青华路15号', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '店外坝子可带犬，需牵绳' }), -0.010, -0.030, 4.3],
    ['park', '浣花溪公园', '青羊区浣花南路', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '靠近草堂路草坪可遛' }), -0.005, -0.042, 4.6],
    ['pet_park', '成都温江泰迪熊宠物公园', '温江区海峡两岸', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '大型犬需评估' }), -0.040, -0.010, 4.5],
    ['cafe', '7号线咖啡(春熙路店)', '锦江区春熙路', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '竹椅坝子带宠友好' }), 0.010, 0.010, 4.2],
    ['hotel', '成都香格里拉大酒店', '锦江区滨江东路9号', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 100, notes: '熊猫主题房，可带宠' }), 0.005, 0.020, 4.6],
    ['mall', 'IFS太古里负一楼广场', '锦江区红星路三段', makeRule({ sizeLimit: 'small', allowIndoor: false, notes: '商场室内仅导盲犬，室外广场可带' }), 0.022, 0.002, 4.1],
    ['scenic_spot', '宽窄巷子外围步道', '青羊区宽窄巷子', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '核心商业街道禁宠，外围步道可遛' }), -0.018, -0.008, 4.4],
    ['restaurant', '巴蜀大妙火锅', '锦江区东大街', makeRule({ sizeLimit: 'medium', hasOutdoorSeat: true, notes: '庭院火锅区带宠友好' }), 0.030, 0.005, 4.5],
    ['cafe', 'Coffee Plum', '青羊区奎星楼街', makeRule({ sizeLimit: 'any', hasOutdoorSeat: true, notes: '独立小院带宠友好' }), -0.025, -0.018, 4.3],
    ['park', '三圣花乡·白鹭湾', '锦江区三圣乡', makeRule({ sizeLimit: 'any', leashRequired: true, notes: '花海旺季牵绳，其它季节可放开' }), 0.035, 0.040, 4.5],
    ['pet_park', '成华区萌宠乐园', '成华区万年场', makeRule({ sizeLimit: 'any', leashRequired: false, notes: '周末需要提前预约时段' }), 0.045, 0.015, 4.4],
    ['hotel', '成都博舍酒店', '锦江区笔帖式街', makeRule({ sizeLimit: 'any', allowIndoor: true, fee: 120, notes: '宽窄巷子旁，宠物床需提前告知' }), -0.010, -0.005, 4.7],
  ],
}

const CITIES: Record<CityId, CityMeta> = Object.fromEntries(
  (Object.keys(cityLayouts) as CityId[]).map((id) => [
    id,
    { id, name: cityLayouts[id].name, center: cityLayouts[id].center, zoom: cityLayouts[id].zoom },
  ]),
) as Record<CityId, CityMeta>

function buildPlacesFor(cityId: CityId): Place[] {
  const layout = cityLayouts[cityId]
  return placementsByCity[cityId].map(([category, name, address, rule, dLat, dLng, rating], idx) => ({
    id: `${cityId}-${idx + 1}`,
    name,
    city: cityId,
    category,
    address,
    lat: Number((layout.center[0] + dLat).toFixed(4)),
    lng: Number((layout.center[1] + dLng).toFixed(4)),
    rule,
    description: `${name}：位于${layout.name}，支持宠物友好进入。具体需以现场提示为准。`,
    verifierCount: verifier(8, 6),
    lastVerifiedAt: lastVerified(21),
    consistencyScore: score(0.88, 0.1),
    tags: [category, 'pet-friendly'],
    rating,
  }))
}

const PLACES: Record<CityId, Place[]> = {
  shanghai: buildPlacesFor('shanghai'),
  beijing: buildPlacesFor('beijing'),
  guangzhou: buildPlacesFor('guangzhou'),
  chengdu: buildPlacesFor('chengdu'),
}

export { CITIES, PLACES, todayISO }
