import { tourismRegions } from './tourismRegions'

// 행정구역 경계가 아니라 전국의 날씨 차이를 비교하기 위한 대표 지점입니다.
export const koreaWeatherGrid = tourismRegions.map(
  ({ id, name, region, latitude, longitude, spots }) => ({
    id,
    name,
    region,
    latitude,
    longitude,
    spots,
  }),
)
