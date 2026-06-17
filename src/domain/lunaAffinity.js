import lunaKittenImage from '../assets/luna-kitten.jpg';
import lunaMamaImage from '../assets/luna-mama.jpg';
import lunaWithMamaAiImage from '../assets/luna-with-mama-ai.jpg';

export const PETS_REQUIRED_TO_WAKE = 30;
export const INACTIVITY_SLEEP_MS = 60 * 60 * 1000;

export const LUNA_AFFINITY_LEVELS = [
  {
    level: 1,
    title: 'Dulce Acariciadora 🐾',
    required: 0,
    message: 'Noté tus primeras caricias y abrí un ojito para mirarte.',
  },
  {
    level: 2,
    title: 'Amiguita de Luna 🌙',
    required: 30,
    message: 'Ya reconozco tu presencia y quiero enseñarte una foto mía de chiquita.',
  },
  {
    level: 3,
    title: 'Compañera de Bigotes 🐱',
    required: 60,
    message: 'Quiero presentarte a mi mamá. Ya no está conmigo, pero cuando me acaricias con tanta ternura siento que su amor todavía me acompaña.',
  },
  {
    level: 4,
    title: 'Guardiana de Siestas 😴',
    required: 100,
    message: 'Confío tanto en ti que puedo dormir profundamente a tu lado.',
  },
  {
    level: 5,
    title: 'Encantadora Felina ✨',
    required: 160,
    message: 'Cada vez que apareces, espero recibir un poquito de cariño.',
  },
  {
    level: 6,
    title: 'Susurradora de Ronroneos 💕',
    required: 230,
    message: 'Respondo a tus caricias con suaves ronroneos llenos de felicidad.',
  },
  {
    level: 7,
    title: 'Mejor Amiga de Luna 🌸',
    required: 320,
    message: 'Ya no eres una visita. Te considero una amiga especial.',
  },
  {
    level: 8,
    title: 'Corazón Gatuno 💖',
    required: 450,
    message: 'Guardo un lugar muy especial para ti dentro de mi pequeño corazón.',
  },
  {
    level: 9,
    title: 'Princesa de los Bigotes 👑',
    required: 650,
    message: 'Si pudiera elegir a alguien para consentirme siempre, te elegiría a ti.',
  },
  {
    level: 10,
    title: 'Alma Gemela de Luna 🌙✨',
    required: 1000,
    message: 'Has alcanzado nuestro vínculo más fuerte. Te quiero como parte de mi familia.',
  },
];

export const LUNA_MEMORIES = [
  {
    id: 'luna-kitten',
    level: 2,
    title: 'Esta soy yo de chiquita',
    text: 'Mira, esta era yo cuando era una gatita pequeñita. Tenía esos ojitos curiosos y todavía estaba aprendiendo a confiar en el mundo.',
    image: lunaKittenImage,
    imageAlt: 'Luna cuando era chiquita',
  },
  {
    id: 'luna-mama',
    level: 3,
    title: 'Te presento a mi mamá',
    text: 'Ella ya no está conmigo, pero la llevo en mis recuerdos más suaves. Cuando me acompañas con cariño, siento un poquito de la calma que ella me dejó.',
    image: lunaMamaImage,
    imageAlt: 'Mamá de Luna',
  },
  {
    id: 'safe-sleeping-place',
    level: 5,
    text: 'Mi lugar favorito para dormir es donde me siento protegida.',
  },
  {
    id: 'luna-with-mama-ai',
    level: 5,
    title: 'Así me imagino con mi mamá',
    text: 'Esta imagen fue creada con IA, pero para mí se siente como un sueño suave: yo descansando junto a mi mamá, como si todavía pudiera abrazarme con su calma.',
    image: lunaWithMamaAiImage,
    imageAlt: 'Imagen generada con IA de Luna junto a su mamá',
  },
  {
    id: 'closed-eyes-trust',
    level: 7,
    text: 'A veces cierro los ojos porque me siento completamente segura.',
  },
  {
    id: 'happier-days',
    level: 10,
    text: 'Gracias por acompañarme. Mis días son más felices contigo.',
  },
];

export const getCurrentAffinityLevel = (affinityPoints = 0) =>
  LUNA_AFFINITY_LEVELS.reduce((currentLevel, level) => {
    if (affinityPoints >= level.required) {
      return level;
    }

    return currentLevel;
  }, LUNA_AFFINITY_LEVELS[0]);

export const getNextAffinityLevel = (currentLevelNumber) =>
  LUNA_AFFINITY_LEVELS.find((level) => level.level === currentLevelNumber + 1) ?? null;

export const getUnlockedLevelNumbers = (affinityPoints = 0) =>
  LUNA_AFFINITY_LEVELS.filter((level) => affinityPoints >= level.required).map((level) => level.level);

export const getUnlockedMemoryIds = (currentLevelNumber = 1) =>
  LUNA_MEMORIES.filter((memory) => currentLevelNumber >= memory.level).map((memory) => memory.id);
