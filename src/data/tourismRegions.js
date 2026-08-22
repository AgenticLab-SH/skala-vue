const region = (id, name, area, shortRegion, latitude, longitude, spots) => ({
  id,
  name,
  region: area,
  shortRegion,
  latitude,
  longitude,
  spots: spots.map(([spotName, type]) => ({ name: spotName, type })),
})

export const tourismRegions = [
  region('seoul', '서울', '서울특별시', '서울', 37.5665, 126.978, [
    ['서울숲', 'outdoor'],
    ['국립중앙박물관', 'indoor'],
    ['북촌한옥마을', 'culture'],
  ]),
  region('incheon', '인천', '인천광역시', '인천', 37.4563, 126.7052, [
    ['송도센트럴파크', 'outdoor'],
    ['국립세계문자박물관', 'indoor'],
    ['월미도', 'coast'],
  ]),
  region('paju', '파주', '경기도', '경기', 37.7599, 126.78, [
    ['임진각', 'culture'],
    ['파주출판도시', 'indoor'],
    ['마장호수', 'outdoor'],
  ]),
  region('gimpo', '김포', '경기도', '경기', 37.6152, 126.7156, [
    ['애기봉평화생태공원', 'outdoor'],
    ['김포아트빌리지', 'culture'],
    ['라베니체', 'outdoor'],
  ]),
  region('suwon', '수원', '경기도', '경기', 37.2636, 127.0286, [
    ['수원화성', 'culture'],
    ['광교호수공원', 'outdoor'],
    ['수원박물관', 'indoor'],
  ]),
  region('gapyeong', '가평', '경기도', '경기', 37.8315, 127.5096, [
    ['남이섬', 'outdoor'],
    ['아침고요수목원', 'outdoor'],
    ['쁘띠프랑스', 'culture'],
  ]),
  region('yangpyeong', '양평', '경기도', '경기', 37.4917, 127.4876, [
    ['두물머리', 'outdoor'],
    ['세미원', 'outdoor'],
    ['양평군립미술관', 'indoor'],
  ]),
  region('pyeongtaek', '평택', '경기도', '경기', 36.9921, 127.1127, [
    ['소풍정원', 'outdoor'],
    ['평택호관광단지', 'outdoor'],
    ['웃다리문화촌', 'indoor'],
  ]),
  region('chuncheon', '춘천', '강원특별자치도', '강원', 37.8813, 127.7298, [
    ['소양강스카이워크', 'outdoor'],
    ['국립춘천박물관', 'indoor'],
    ['의암호', 'outdoor'],
  ]),
  region('sokcho', '속초', '강원특별자치도', '강원', 38.207, 128.5918, [
    ['속초해수욕장', 'coast'],
    ['국립산악박물관', 'indoor'],
    ['영금정', 'coast'],
  ]),
  region('gangneung', '강릉', '강원특별자치도', '강원', 37.7519, 128.8761, [
    ['경포해변', 'coast'],
    ['아르떼뮤지엄 강릉', 'indoor'],
    ['오죽헌', 'culture'],
  ]),
  region('wonju', '원주', '강원특별자치도', '강원', 37.3422, 127.9202, [
    ['뮤지엄 산', 'indoor'],
    ['간현관광지', 'outdoor'],
    ['원주한지테마파크', 'indoor'],
  ]),
  region('taebaek', '태백', '강원특별자치도', '강원', 37.1641, 128.9856, [
    ['태백산', 'mountain'],
    ['365세이프타운', 'indoor'],
    ['황지연못', 'outdoor'],
  ]),
  region('yangyang', '양양', '강원특별자치도', '강원', 38.0754, 128.619, [
    ['낙산사', 'culture'],
    ['서피비치', 'coast'],
    ['오산리선사유적박물관', 'indoor'],
  ]),
  region('donghae', '동해', '강원특별자치도', '강원', 37.5247, 129.1143, [
    ['무릉계곡', 'mountain'],
    ['도째비골스카이밸리', 'outdoor'],
    ['천곡황금박쥐동굴', 'indoor'],
  ]),
  region('pyeongchang', '평창', '강원특별자치도', '강원', 37.3705, 128.3903, [
    ['대관령양떼목장', 'outdoor'],
    ['월정사', 'culture'],
    ['이효석문학관', 'indoor'],
  ]),
  region('cheonan', '천안', '충청남도', '충남', 36.8151, 127.1139, [
    ['독립기념관', 'indoor'],
    ['각원사', 'culture'],
    ['천안홍대용과학관', 'indoor'],
  ]),
  region('chungju', '충주', '충청북도', '충북', 36.991, 127.9259, [
    ['중앙탑사적공원', 'outdoor'],
    ['충주고구려비전시관', 'indoor'],
    ['활옥동굴', 'indoor'],
  ]),
  region('cheongju', '청주', '충청북도', '충북', 36.6424, 127.489, [
    ['국립현대미술관 청주', 'indoor'],
    ['청남대', 'outdoor'],
    ['수암골', 'culture'],
  ]),
  region('daejeon', '대전', '대전광역시', '대전', 36.3504, 127.3845, [
    ['국립중앙과학관', 'indoor'],
    ['한밭수목원', 'outdoor'],
    ['대전시립미술관', 'indoor'],
  ]),
  region('boryeong', '보령', '충청남도', '충남', 36.3332, 126.6128, [
    ['대천해수욕장', 'coast'],
    ['보령석탄박물관', 'indoor'],
    ['성주산자연휴양림', 'mountain'],
  ]),
  region('gongju', '공주', '충청남도', '충남', 36.4465, 127.119, [
    ['공산성', 'culture'],
    ['국립공주박물관', 'indoor'],
    ['무령왕릉과 왕릉원', 'culture'],
  ]),
  region('seosan', '서산', '충청남도', '충남', 36.7845, 126.4503, [
    ['해미읍성', 'culture'],
    ['간월암', 'coast'],
    ['서산버드랜드', 'indoor'],
  ]),
  region('danyang', '단양', '충청북도', '충북', 36.9845, 128.3656, [
    ['도담삼봉', 'outdoor'],
    ['만천하스카이워크', 'mountain'],
    ['다누리아쿠아리움', 'indoor'],
  ]),
  region('jeonju', '전주', '전북특별자치도', '전북', 35.8242, 127.148, [
    ['전주한옥마을', 'culture'],
    ['국립무형유산원', 'indoor'],
    ['전주수목원', 'outdoor'],
  ]),
  region('gunsan', '군산', '전북특별자치도', '전북', 35.9677, 126.7366, [
    ['근대역사박물관', 'indoor'],
    ['경암동철길마을', 'culture'],
    ['선유도', 'coast'],
  ]),
  region('iksan', '익산', '전북특별자치도', '전북', 35.9483, 126.9576, [
    ['미륵사지', 'culture'],
    ['국립익산박물관', 'indoor'],
    ['왕궁리유적', 'culture'],
  ]),
  region('namwon', '남원', '전북특별자치도', '전북', 35.4164, 127.3904, [
    ['광한루원', 'outdoor'],
    ['국립민속국악원', 'indoor'],
    ['지리산허브밸리', 'outdoor'],
  ]),
  region('gwangju', '광주', '광주광역시', '광주', 35.1595, 126.8526, [
    ['국립아시아문화전당', 'indoor'],
    ['무등산', 'mountain'],
    ['양림동역사문화마을', 'culture'],
  ]),
  region('mokpo', '목포', '전라남도', '전남', 34.8118, 126.3922, [
    ['국립해양유산연구소', 'indoor'],
    ['갓바위', 'outdoor'],
    ['목포해상케이블카', 'coast'],
  ]),
  region('yeosu', '여수', '전라남도', '전남', 34.7604, 127.6622, [
    ['오동도', 'coast'],
    ['아쿠아플라넷 여수', 'indoor'],
    ['여수해상케이블카', 'coast'],
  ]),
  region('suncheon', '순천', '전라남도', '전남', 34.9506, 127.4872, [
    ['순천만국가정원', 'outdoor'],
    ['순천만습지', 'outdoor'],
    ['순천드라마촬영장', 'culture'],
  ]),
  region('damyang', '담양', '전라남도', '전남', 35.3214, 126.9882, [
    ['죽녹원', 'outdoor'],
    ['메타세쿼이아길', 'outdoor'],
    ['한국대나무박물관', 'indoor'],
  ]),
  region('wando', '완도', '전라남도', '전남', 34.311, 126.7551, [
    ['완도타워', 'outdoor'],
    ['장보고기념관', 'indoor'],
    ['청산도', 'coast'],
  ]),
  region('daegu', '대구', '대구광역시', '대구', 35.8714, 128.6014, [
    ['국립대구박물관', 'indoor'],
    ['앞산전망대', 'mountain'],
    ['수성못', 'outdoor'],
  ]),
  region('andong', '안동', '경상북도', '경북', 36.5684, 128.7294, [
    ['하회마을', 'culture'],
    ['안동시립민속박물관', 'indoor'],
    ['월영교', 'outdoor'],
  ]),
  region('pohang', '포항', '경상북도', '경북', 36.019, 129.3435, [
    ['호미곶', 'coast'],
    ['스페이스워크', 'outdoor'],
    ['포항시립미술관', 'indoor'],
  ]),
  region('gyeongju', '경주', '경상북도', '경북', 35.8562, 129.2247, [
    ['대릉원', 'culture'],
    ['국립경주박물관', 'indoor'],
    ['동궁과 월지', 'outdoor'],
  ]),
  region('ulsan', '울산', '울산광역시', '울산', 35.5384, 129.3114, [
    ['대왕암공원', 'coast'],
    ['울산박물관', 'indoor'],
    ['장생포고래문화마을', 'culture'],
  ]),
  region('busan', '부산', '부산광역시', '부산', 35.1796, 129.0756, [
    ['광안리', 'coast'],
    ['국립해양박물관', 'indoor'],
    ['감천문화마을', 'culture'],
  ]),
  region('changwon', '창원', '경상남도', '경남', 35.2281, 128.6811, [
    ['용지호수공원', 'outdoor'],
    ['창원과학체험관', 'indoor'],
    ['진해해양공원', 'coast'],
  ]),
  region('jinju', '진주', '경상남도', '경남', 35.1799, 128.1076, [
    ['진주성', 'culture'],
    ['국립진주박물관', 'indoor'],
    ['남강', 'outdoor'],
  ]),
  region('gimhae', '김해', '경상남도', '경남', 35.2285, 128.8894, [
    ['수로왕릉', 'culture'],
    ['국립김해박물관', 'indoor'],
    ['김해가야테마파크', 'outdoor'],
  ]),
  region('tongyeong', '통영', '경상남도', '경남', 34.8544, 128.4332, [
    ['동피랑벽화마을', 'culture'],
    ['통영케이블카', 'outdoor'],
    ['세자트라숲', 'outdoor'],
  ]),
  region('geoje', '거제', '경상남도', '경남', 34.8806, 128.6211, [
    ['바람의언덕', 'coast'],
    ['거제포로수용소유적공원', 'culture'],
    ['거제식물원', 'indoor'],
  ]),
  region('namhae', '남해', '경상남도', '경남', 34.8377, 127.8926, [
    ['독일마을', 'culture'],
    ['다랭이마을', 'outdoor'],
    ['보물섬전망대', 'coast'],
  ]),
  region('jeju', '제주', '제주특별자치도', '제주', 33.4996, 126.5312, [
    ['이호테우해변', 'coast'],
    ['제주도립미술관', 'indoor'],
    ['용두암', 'coast'],
  ]),
  region('seogwipo', '서귀포', '제주특별자치도', '제주', 33.2541, 126.5601, [
    ['성산일출봉', 'mountain'],
    ['아쿠아플라넷 제주', 'indoor'],
    ['천지연폭포', 'outdoor'],
  ]),
]

export const tourismRegionById = new Map(tourismRegions.map((item) => [item.id, item]))

const spotLabels = {
  indoor: '실내',
  outdoor: '산책',
  coast: '바다',
  mountain: '자연',
  culture: '문화',
}

export function getWeatherMatchedSpots(city, weather, limit = 3) {
  const condition = weather?.condition ?? ''
  const rainProbability = weather?.precipitationProbability ?? 0
  const wet = /비|소나기|뇌우|눈/.test(condition) || rainProbability >= 60
  const cloudy = /구름|흐림|안개/.test(condition)
  const priority = wet
    ? ['indoor', 'culture', 'outdoor', 'coast', 'mountain']
    : cloudy
      ? ['culture', 'outdoor', 'indoor', 'coast', 'mountain']
      : ['outdoor', 'coast', 'mountain', 'culture', 'indoor']

  return [...(city.spots ?? [])]
    .sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type))
    .slice(0, limit)
    .map((spot) => ({
      ...spot,
      label: spotLabels[spot.type] ?? '관광',
      reason: wet
        ? spot.type === 'indoor'
          ? '비가 와도 둘러보기 편합니다.'
          : '강수 상태를 확인하고 이동합니다.'
        : cloudy
          ? '구름이 있어 천천히 둘러보기 좋습니다.'
          : '맑은 날 풍경을 보기 좋습니다.',
    }))
}
