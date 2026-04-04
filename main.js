import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf2f2f2)

// Licht
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.05
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('app').appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Loader
const loader = new GLTFLoader()

// UI
const input = document.getElementById('modelUrlInput')
const button = document.getElementById('loadModelBtn')
const modelList = document.getElementById('modelList')
const modelTitle = document.getElementById('modelTitle')
const modelSubtitle = document.getElementById('modelSubtitle')
const startBtn = document.getElementById('startBtn')
const arBtn = document.getElementById('arBtn')

// Modellenlijst
const models = [
  {
    name: 'Ottomaanse fontein',
    description: 'Fotogrammetrie model',
    url: 'https://wjjhhgtdsvorimnucbjq.supabase.co/storage/v1/object/public/models/ottomaanse%20fontein%201.glb'
  },
  {
    name: 'Test model',
    description: 'Voeg hier later extra modellen toe',
    url: 'https://wjjhhgtdsvorimnucbjq.supabase.co/storage/v1/object/public/models/ottomaanse%20fontein%201.glb'
  }
]

const defaultModel = models[0]

let currentModel = null
let currentModelUrl = defaultModel.url

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  object.position.x -= center.x
  object.position.y -= box.min.y
  object.position.z -= center.z

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2))

  cameraZ *= 1.8

  camera.position.set(0, maxDim * 0.4, cameraZ)

  camera.near = Math.max(0.01, maxDim / 100)
  camera.far = Math.max(1000, maxDim * 100)
  camera.updateProjectionMatrix()

  controls.target.set(0, maxDim * 0.3, 0)
  controls.update()
}

function fixMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material]

    mats.forEach((mat) => {
      if (!mat) return

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace
      }

      if ('metalness' in mat) mat.metalness = 0
      if ('roughness' in mat) mat.roughness = 1
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0

      mat.needsUpdate = true
    })
  })
}

function loadModel(url, name = 'Model', description = '3D model geladen') {
  loader.load(
    url,
    (gltf) => {
      if (currentModel) {
        scene.remove(currentModel)
      }

      currentModel = gltf.scene
      currentModelUrl = url

      fixMaterials(currentModel)

      // Juiste rotatie
      currentModel.rotation.x = Math.PI
      currentModel.rotation.y = -Math.PI - Math.PI / 4
      currentModel.rotation.z = 0

      scene.add(currentModel)
      fitCameraToObject(currentModel)

      modelTitle.textContent = name
      modelSubtitle.textContent = description
    },
    undefined,
    (error) => {
      console.error('Fout bij laden model:', error)
      alert('Model kon niet geladen worden.')
    }
  )
}

// Startmodel laden
loadModel(defaultModel.url, defaultModel.name, defaultModel.description)

// Knop voor manuele link
button.addEventListener('click', () => {
  const url = input.value.trim()
  if (!url) return
  loadModel(url, 'Eigen GLB link', 'Handmatig geladen model')
})

// Startknop
if (startBtn) {
  startBtn.addEventListener('click', () => {
    document.getElementById('app').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  })
}

// Echte AR-knop
if (arBtn) {
  arBtn.addEventListener('click', () => {
    if (!currentModelUrl) return

    const arPageUrl = `/ar.html?src=${encodeURIComponent(currentModelUrl)}`
    window.open(arPageUrl, '_blank')
  })
}

// Sidebar met modellen
models.forEach((model) => {
  const card = document.createElement('button')
  card.className = 'model-card'
  card.type = 'button'

  card.innerHTML = `
    <h3>${model.name}</h3>
    <p>${model.description}</p>
  `

  card.addEventListener('click', () => {
    loadModel(model.url, model.name, model.description)
  })

  modelList.appendChild(card)
})

// Animatie
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})