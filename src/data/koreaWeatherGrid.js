import { tourismRegions } from './tourismRegions'

const detailSamples = [
  { suffix: '', label: '중심권', latitudeOffset: 0, longitudeOffset: 0, detailLevel: 'region' },
  {
    suffix: '-ne',
    label: '북동권',
    latitudeOffset: 0.038,
    longitudeOffset: 0.052,
    detailLevel: 'local',
  },
  {
    suffix: '-sw',
    label: '남서권',
    latitudeOffset: -0.038,
    longitudeOffset: -0.052,
    detailLevel: 'local',
  },
]

// 행정구역 경계를 흉내 내지 않고, 각 기준 지역 주변을 세 지점으로 나눠 날씨 차이를 확인합니다.
export const koreaWeatherGrid = tourismRegions.flatMap((region) =>
  detailSamples.map((sample) => ({
    id: `${region.id}${sample.suffix}`,
    regionId: region.id,
    name: sample.detailLevel === 'region' ? region.name : `${region.name} ${sample.label}`,
    mapLabel: sample.detailLevel === 'region' ? region.name : sample.label,
    regionName: region.name,
    region: region.region,
    subregion: sample.label,
    detailLevel: sample.detailLevel,
    latitude: Number((region.latitude + sample.latitudeOffset).toFixed(4)),
    longitude: Number((region.longitude + sample.longitudeOffset).toFixed(4)),
    spots: region.spots,
  })),
)
