import { tourismRegionById } from './tourismRegions'

const plannerCityDetails = {
  seoul: { temperature: 28, condition: '맑음', humidity: 58, wind: '2.4 m/s' },
  suwon: { temperature: 24, condition: '비', humidity: 76, wind: '1.7 m/s' },
  changwon: { temperature: 25, condition: '구름 많음', humidity: 71, wind: '2.1 m/s' },
  busan: { temperature: 26, condition: '흐림', humidity: 68, wind: '3.1 m/s' },
  gangneung: { temperature: 24, condition: '맑음', humidity: 62, wind: '3.4 m/s' },
  daejeon: { temperature: 27, condition: '구름 조금', humidity: 63, wind: '1.9 m/s' },
  jeonju: { temperature: 27, condition: '흐림', humidity: 70, wind: '2.0 m/s' },
  jeju: {
    temperature: 26,
    condition: '바람',
    humidity: 73,
    wind: '5.4 m/s',
    transportMode: 'air',
  },
  incheon: { temperature: 26, condition: '구름 조금', humidity: 66, wind: '3.0 m/s' },
  chuncheon: { temperature: 25, condition: '구름 많음', humidity: 69, wind: '1.8 m/s' },
  sokcho: { temperature: 24, condition: '흐림', humidity: 72, wind: '3.5 m/s' },
  danyang: { temperature: 25, condition: '구름 조금', humidity: 64, wind: '1.5 m/s' },
  boryeong: { temperature: 25, condition: '흐림', humidity: 74, wind: '3.2 m/s' },
  gwangju: { temperature: 28, condition: '구름 많음', humidity: 67, wind: '2.1 m/s' },
  yeosu: { temperature: 26, condition: '맑음', humidity: 72, wind: '3.7 m/s' },
  daegu: { temperature: 29, condition: '맑음', humidity: 55, wind: '1.8 m/s' },
  gyeongju: { temperature: 27, condition: '구름 조금', humidity: 61, wind: '2.2 m/s' },
  seogwipo: {
    temperature: 27,
    condition: '구름 조금',
    humidity: 75,
    wind: '4.6 m/s',
    transportMode: 'air',
  },
}

const administrativeOfficeByCityId = {
  seoul: { name: '서울시청', latitude: 37.5665, longitude: 126.978 },
  suwon: { name: '수원시청', latitude: 37.2636, longitude: 127.0286 },
  changwon: { name: '창원시청', latitude: 35.2281, longitude: 128.6811 },
  busan: { name: '부산시청', latitude: 35.1796, longitude: 129.0756 },
  gangneung: { name: '강릉시청', latitude: 37.7519, longitude: 128.8761 },
  daejeon: { name: '대전시청', latitude: 36.3504, longitude: 127.3845 },
  jeonju: { name: '전주시청', latitude: 35.8242, longitude: 127.148 },
  jeju: { name: '제주시청', latitude: 33.4996, longitude: 126.5312 },
  incheon: { name: '인천시청', latitude: 37.4563, longitude: 126.7052 },
  chuncheon: { name: '춘천시청', latitude: 37.8813, longitude: 127.7298 },
  sokcho: { name: '속초시청', latitude: 38.207, longitude: 128.5918 },
  danyang: { name: '단양군청', latitude: 36.9845, longitude: 128.3656 },
  boryeong: { name: '보령시청', latitude: 36.3332, longitude: 126.6128 },
  gwangju: { name: '광주시청', latitude: 35.1595, longitude: 126.8526 },
  yeosu: { name: '여수시청', latitude: 34.7604, longitude: 127.6622 },
  daegu: { name: '대구시청', latitude: 35.8714, longitude: 128.6014 },
  gyeongju: { name: '경주시청', latitude: 35.8562, longitude: 129.2247 },
  seogwipo: { name: '서귀포시청', latitude: 33.2541, longitude: 126.5601 },
}

export const weatherCities = Object.entries(plannerCityDetails).map(([id, details]) => {
  const region = tourismRegionById.get(id)
  const administrativeOffice = administrativeOfficeByCityId[id]
  return {
    ...region,
    ...details,
    administrativeOffice: administrativeOffice.name,
    latitude: administrativeOffice.latitude,
    longitude: administrativeOffice.longitude,
    place: region.spots[0].name,
  }
})
