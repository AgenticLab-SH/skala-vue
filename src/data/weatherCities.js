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

export const weatherCities = Object.entries(plannerCityDetails).map(([id, details]) => {
  const region = tourismRegionById.get(id)
  return {
    ...region,
    ...details,
    place: region.spots[0].name,
    activityNote: `${region.spots.map((spot) => spot.name).join(', ')} 중 날씨에 맞는 곳을 골라볼 수 있습니다.`,
  }
})
