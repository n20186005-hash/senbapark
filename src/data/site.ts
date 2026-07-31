export const facts = {
  name: '千波公園',
  alternateName: '千波湖',
  address: '〒310-0851 茨城県水戸市千波町3080',
  latitude: 36.370985,
  longitude: 140.4541765,
  ratingValue: 4.1,
  ratingCount: 3483,
  loopDistance: '約3.0km',
  stay: '60〜150分',
  admission: '入園無料',
  opening: '公園は24時間利用可',
} as const;

export const itineraryItems = [
  { id: 'lake-loop', title: '千波湖一周ウォーク', note: '約3kmの湖畔を自分のペースで' },
  { id: 'koubun-cafe', title: '好文cafe周辺', note: '湖を眺めながらひと休み' },
  { id: 'mito-komon', title: '徳川光圀公像', note: '水戸らしい記念写真スポット' },
  { id: 'sakura', title: '桜並木', note: '春は朝の散策がおすすめ' },
  { id: 'fountain', title: '湖上噴水', note: '夕景と合わせて眺めたい場所' },
  { id: 'kairakuen', title: '偕楽園へ足を延ばす', note: '梅・歴史・庭園を組み合わせる' },
] as const;

export const faqItems = [
  {
    question: '千波公園の入園料はかかりますか？',
    answer: '公園への入園は無料です。ボート、飲食、館内施設、イベントなどは別途料金がかかる場合があります。',
  },
  {
    question: '千波湖は一周どのくらいですか？',
    answer: '湖畔の周回コースは約3kmです。散歩なら休憩を含めて45〜70分ほどを目安にすると、景色をゆっくり楽しめます。',
  },
  {
    question: '水戸駅から歩いて行けますか？',
    answer: 'JR水戸駅南口から徒歩でアクセスできます。荷物が多い場合や暑い日は、北口6番のりばから千波湖方面のバスを利用すると便利です。',
  },
  {
    question: '駐車場はありますか？',
    answer: '千波湖西側など周辺に駐車場があります。場所ごとに利用時間や料金が異なり、イベント時は混雑するため、現地案内を確認してください。',
  },
  {
    question: '犬と一緒に散歩できますか？',
    answer: '湖畔は犬連れの散歩にも利用されています。リードを着用し、ふんの持ち帰りや周囲への配慮など基本的なマナーを守ってください。',
  },
  {
    question: 'おすすめの時間帯はいつですか？',
    answer: '静かに歩くなら早朝、写真を撮るなら夕方がおすすめです。桜や梅の時期、週末、イベント開催日は混みやすいため、時間に余裕を持ってください。',
  },
] as const;
