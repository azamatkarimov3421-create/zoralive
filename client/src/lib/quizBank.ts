export interface QuizQuestion {
  id: string;
  category: 'ALL' | 'WORLD' | 'SPORT' | 'LOGIC';
  q: string;
  options: [string, string, string, string];
  correct: number;
}

export const QUIZ_CATEGORIES = [
  { id: 'ALL', label: '🌐 Aralash' },
  { id: 'WORLD', label: '🗺️ Dunyo' },
  { id: 'SPORT', label: '⚽ Sport' },
  { id: 'LOGIC', label: '🧠 Mantiq' },
] as const;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 'q1', category: 'WORLD', q: 'O‘zbekistonning eng uzun daryosi qaysi?', options: ['Zarafshon', 'Sirdaryo', 'Amudaryo', 'Chirchiq'], correct: 1 },
  { id: 'q2', category: 'WORLD', q: 'Dunyodagi eng baland tog‘ cho‘qqisi qaysi?', options: ['K2', 'Everest', 'Kilimanjaro', 'Elbrus'], correct: 1 },
  { id: 'q3', category: 'WORLD', q: 'Yaponiya poytaxti qaysi shahar?', options: ['Osaka', 'Kioto', 'Tokio', 'Seul'], correct: 2 },
  { id: 'q4', category: 'WORLD', q: 'Quyosh tizimidagi eng katta sayyora qaysi?', options: ['Saturn', 'Mars', 'Yupiter', 'Neptun'], correct: 2 },
  { id: 'q5', category: 'WORLD', q: 'Registon maydoni qaysi shaharda joylashgan?', options: ['Buxoro', 'Xiva', 'Samarqand', 'Shahrisabz'], correct: 2 },
  { id: 'q6', category: 'WORLD', q: 'Dunyodagi eng katta okean qaysi?', options: ['Atlantika', 'Hind', 'Tinch okeani', 'Shimoliy Muz'], correct: 2 },
  { id: 'q7', category: 'WORLD', q: 'Eyfel minorasi qaysi shaharda joylashgan?', options: ['Rim', 'Parij', 'London', 'Berlin'], correct: 1 },
  { id: 'q8', category: 'WORLD', q: 'Misr piramidalari qaysi shahar yaqinida joylashgan?', options: ['Qohira', 'Iskandariya', 'Dubay', 'Istanbul'], correct: 0 },
  { id: 'q9', category: 'SPORT', q: 'Futbol maydonida bitta jamoadan nechta o‘yinchi o‘ynaydi?', options: ['9 ta', '10 ta', '11 ta', '12 ta'], correct: 2 },
  { id: 'q10', category: 'SPORT', q: 'Olimpiya bayrog‘ida nechta halqa bor?', options: ['4 ta', '5 ta', '6 ta', '7 ta'], correct: 1 },
  { id: 'q11', category: 'SPORT', q: 'Shaxmat taxtasida jami nechta katak bor?', options: ['48 ta', '56 ta', '64 ta', '72 ta'], correct: 2 },
  { id: 'q12', category: 'SPORT', q: 'Boks bo‘yicha Olimpiada chempioni Hasanboy Do‘smatov qaysi davlat vakili?', options: ['Qozog‘iston', 'O‘zbekiston', 'Turkiya', 'Ozarbayjon'], correct: 1 },
  { id: 'q13', category: 'SPORT', q: 'Futbolda bitta taym necha daqiqa davom etadi?', options: ['30 daqiqa', '40 daqiqa', '45 daqiqa', '50 daqiqa'], correct: 2 },
  { id: 'q14', category: 'SPORT', q: 'Basketbol savatiga uzoq masofadan tushirilgan to‘p necha ochko beradi?', options: ['1 ochko', '2 ochko', '3 ochko', '4 ochko'], correct: 2 },
  { id: 'q15', category: 'SPORT', q: 'Tennisda "0" hisobi inglizcha qanday ataladi?', options: ['Zero', 'Love', 'Null', 'Ace'], correct: 1 },
  { id: 'q16', category: 'LOGIC', q: '12 × 12 nechaga teng?', options: ['124', '132', '144', '156'], correct: 2 },
  { id: 'q17', category: 'LOGIC', q: '1 haftada necha soat bor?', options: ['144 soat', '168 soat', '172 soat', '196 soat'], correct: 1 },
  { id: 'q18', category: 'LOGIC', q: 'Suvning kimyoviy formulasi qaysi?', options: ['CO2', 'H2O', 'O2', 'NaCl'], correct: 1 },
  { id: 'q19', category: 'LOGIC', q: 'Kompyuterda "CPU" nimani anglatadi?', options: ['Markaziy protsessor', 'Tezkor xotira', 'Video karta', 'Qattiq disk'], correct: 0 },
  { id: 'q20', category: 'LOGIC', q: 'Bir yilda necha oy 31 kundan iborat?', options: ['5 ta', '6 ta', '7 ta', '8 ta'], correct: 2 },
  { id: 'q21', category: 'LOGIC', q: 'Qaysi son tub son (faqat 1 ga va o‘ziga bo‘linadi)?', options: ['21', '27', '29', '33'], correct: 2 },
  { id: 'q22', category: 'LOGIC', q: 'Yorug‘lik tezligi taxminan soniyasiga necha km?', options: ['30 000 km', '150 000 km', '300 000 km', '1 000 000 km'], correct: 2 },
  { id: 'q23', category: 'WORLD', q: 'Amir Temur qaysi shaharda tug‘ilgan?', options: ['Samarqand', 'Shahrisabz (Kesh)', 'Toshkent', 'Termiz'], correct: 1 },
  { id: 'q24', category: 'WORLD', q: 'Alisher Navoiy qaysi asrda yashagan?', options: ['XIII asr', 'XIV asr', 'XV asr', 'XVI asr'], correct: 2 },
  { id: 'q25', category: 'LOGIC', q: 'Uchburchakning ichki burchaklari yig‘indisi nechaga teng?', options: ['90°', '180°', '270°', '360°'], correct: 1 },
];

export function pickQuizQuestions(category: string, count: number): QuizQuestion[] {
  const pool =
    category === 'ALL'
      ? [...QUIZ_QUESTIONS]
      : QUIZ_QUESTIONS.filter((q) => q.category === category);
  const source = pool.length >= count ? pool : [...QUIZ_QUESTIONS];
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }
  return source.slice(0, Math.min(count, source.length));
}
