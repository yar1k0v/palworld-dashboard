/**
 * World-map regions, extracted from the game's own data.
 *
 * Bounds are the `landScapeRealPositionMin/Max` values in
 * Pal/Content/Pal/DataTable/WorldMapUIData/DT_WorldMapUIData, and each region's
 * 8192x8192 texture spans exactly its own box. Tiles under public/ are sliced
 * from those textures by tools/build_tiles.py.
 *
 * Palpagos and the World Tree are separate regions, not one world: they sit
 * adjacent (2,048 uu of overlap in X) at very different scales - 1.77 m/px vs
 * 0.42 m/px - so they get a switcher rather than a merged tileset.
 */

export type RegionId = 'main' | 'tree'

export interface Region {
  id: RegionId
  label: string
  tileUrl: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  /** deepest zoom with real pixels; beyond this Leaflet upscales */
  nativeZoom: number
}

export const REGIONS: Record<RegionId, Region> = {
  main: {
    id: 'main',
    label: 'Palpagos',
    tileUrl: '/tiles/{z}/{x}/{y}.png',
    minX: -1099400,
    maxX: 349400,
    minY: -724400,
    maxY: 724400,
    nativeZoom: 5,
  },
  tree: {
    id: 'tree',
    label: 'World Tree',
    tileUrl: '/tiles-tree/{z}/{x}/{y}.png',
    minX: 347351.5,
    maxX: 689148.5,
    minY: -818197,
    maxY: -476400,
    nativeZoom: 5,
  },
}

export const REGION_LIST = [REGIONS.main, REGIONS.tree]

/** Every region's texture is mapped onto this same square in Leaflet space. */
export const MAP_MIN = -512
export const MAP_MAX = 512
export const MAP_EXTENT: [[number, number], [number, number]] = [
  [MAP_MIN, MAP_MIN],
  [MAP_MAX, MAP_MAX],
]

/**
 * Game coordinates -> Leaflet [lat, lng].
 *
 * Note the axis swap, which the CRS transformation in map.tsx relies on:
 * game X drives lat (vertical), game Y drives lng (horizontal).
 */
export function gameToLatLng(
  x: number,
  y: number,
  region: Region
): [number, number] {
  const span = MAP_MAX - MAP_MIN
  const lat = MAP_MIN + ((x - region.minX) / (region.maxX - region.minX)) * span
  const lng = MAP_MIN + ((y - region.minY) / (region.maxY - region.minY)) * span
  return [lat, lng]
}

/** Normalized 0..1 position (as the tower table stores them) -> [lat, lng]. */
export function normalizedToLatLng(u: number, v: number): [number, number] {
  const span = MAP_MAX - MAP_MIN
  return [MAP_MIN + u * span, MAP_MIN + v * span]
}

export function isInRegion(x: number, y: number, region: Region): boolean {
  return (
    x >= region.minX && x <= region.maxX && y >= region.minY && y <= region.maxY
  )
}

/**
 * Which region a world position belongs to. The World Tree is checked first:
 * it is the smaller, more specific box, and the two overlap slightly in X.
 */
export function regionOf(x: number, y: number): RegionId {
  return isInRegion(x, y, REGIONS.tree) ? 'tree' : 'main'
}

/**
 * Fast-travel towers on the Palpagos map, as normalized 0..1 positions.
 * Reprojected from the pre-1.0 tile window onto the current bounds; verified
 * by land-mask check (75/75 on or within ~30 m of land).
 */
export const TRAVEL_POINTS: [number, number][] = [
  [0.5336832883620066, 0.45235271065255084],
  [0.5061459915953338, 0.42182401600795016],
  [0.474110346898507, 0.48374974449102753],
  [0.43884684245568345, 0.4580230222450973],
  [0.47266356271421633, 0.43891744204257016],
  [0.49553890946577805, 0.3561336766793993],
  [0.5958906284745182, 0.43204258345395724],
  [0.7785910741412599, 0.7795183258838118],
  [0.7237018741423961, 0.6975967734610697],
  [0.782572060721744, 0.7208590378755343],
  [0.838800614765429, 0.774872284387666],
  [0.6765888699367302, 0.5954340467483047],
  [0.7029987455232807, 0.5975755691843551],
  [0.7311719265611235, 0.6100138856613941],
  [0.7636626990434693, 0.5772226582824517],
  [0.828201037947492, 0.533874498649315],
  [0.8196224941839194, 0.5654140614398065],
  [0.21068413549570184, 0.17190474722754331],
  [0.6778378840192423, 0.8067819837867808],
  [0.7146408382271426, 0.4629112872211353],
  [0.6987468254183585, 0.4043521646219301],
  [0.7406856568273898, 0.41948370219940784],
  [0.740416177756948, 0.44651596757537954],
  [0.780651823659711, 0.4448064248302744],
  [0.7566787638762053, 0.39879747321164144],
  [0.41273589760486706, 0.35367366171824527],
  [0.355058091877181, 0.326668248222454],
  [0.21508917081181225, 0.3284983105075749],
  [0.2794052773017205, 0.2793056879502567],
  [0.23706675206461966, 0.25731353474082713],
  [0.14947424101607387, 0.2037730543190183],
  [0.27872324667346854, 0.23396565494058183],
  [0.35301555045034194, 0.16869343343793722],
  [0.29764674184737533, 0.38244226825700883],
  [0.3658043546987279, 0.30374513478900095],
  [0.6690334646467745, 0.46400743832576263],
  [0.586477706538082, 0.7344154470129577],
  [0.5560976307718644, 0.6049610905463412],
  [0.5395311118837103, 0.5877776967306181],
  [0.664132993086753, 0.43800731848276686],
  [0.6974196669908552, 0.4979244591575186],
  [0.6413840165911867, 0.48057168848501647],
  [0.44952220578555524, 0.5778117395674505],
  [0.49994830403137663, 0.5860367386017017],
  [0.5017098246578787, 0.5444525143177004],
  [0.5758718992833765, 0.6847778520078865],
  [0.5648161297481705, 0.7443268450158648],
  [0.6411655811793348, 0.781464881571921],
  [0.6064282710497273, 0.727269931122791],
  [0.5876678433358405, 0.5871168454748795],
  [0.5261243634578808, 0.5744052191340981],
  [0.6105481387951543, 0.5066821007671455],
  [0.6243608937358119, 0.5257807315309051],
  [0.7581831153774128, 0.5006132694316726],
  [0.5344563971462309, 0.5384048966590391],
  [0.5186015737161789, 0.49784754109134177],
  [0.5636707986326511, 0.5412945835134928],
  [0.6083217275149048, 0.5407294308069344],
  [0.581374841741408, 0.6042810476261893],
  [0.643244977456013, 0.6154337282125163],
  [0.6065442915152713, 0.6137961103422993],
  [0.5953171678335185, 0.6312605249583592],
  [0.6541437523221527, 0.646744675098601],
  [0.6723031587941092, 0.6388755032309034],
  [0.6872829492519045, 0.6615224691759474],
  [0.6790613663339188, 0.6987603503661135],
  [0.6363324963509841, 0.6822555189707162],
  [0.6079542893913813, 0.6557880478284285],
  [0.5403692392853003, 0.6459923961244309],
  [0.5237425408208789, 0.6629781774841901],
  [0.5423824448822506, 0.6286833585942938],
  [0.5122618130022367, 0.684263789568246],
  [0.5206015781896791, 0.6320121527867725],
  [0.5673123963925683, 0.6463872714738995],
  [0.5506177251652945, 0.6658397917315233],
]
