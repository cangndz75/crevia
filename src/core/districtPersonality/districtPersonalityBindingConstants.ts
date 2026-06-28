import type { DistrictPersonalityKey } from './districtPersonalityBindingTypes';

export const DISTRICT_PERSONALITY_BINDING_PROHIBITED_TERMS = [
  'sorunlu',
  'agresif',
  'kötü mahalle',
  'başarısız mahalle',
  'bayıldı',
  'dashboard',
  'veri işlendi',
] as const;

type OutcomeCopy = {
  positive: { title: string; description: string };
  neutral: { title: string; description: string };
  warning: { title: string; description: string };
};

export type DistrictPersonalityBindingDefinition = {
  label: string;
  shortTrait: string;
  expectationLabel: string;
  toleranceLabel: string;
  reactsTo: string[];
  positiveResponse: string;
  negativeResponse: string;
  riskWhenIgnored: string;
  mapLabel: string;
  result: OutcomeCopy;
  report: OutcomeCopy;
  replay: {
    cityImpact: string;
    socialEcho: string;
    maintenance: string;
  };
  feed: {
    watchTitle: (districtName: string) => string;
    watchSubtitle: string;
    positiveTitle: (districtName: string) => string;
    positiveSubtitle: string;
  };
  eceHint: string;
};

export const DISTRICT_PERSONALITY_BINDING_DEFINITIONS: Record<
  DistrictPersonalityKey,
  DistrictPersonalityBindingDefinition
> = {
  civic_core: {
    label: 'Merkez Duyarlı',
    shortTrait: 'Görünür hizmete hızlı olumlu tepki verir.',
    expectationLabel: 'Görünür hizmet beklentisi',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['görünür müdahale', 'sosyal nabız', 'kamu alanı'],
    positiveResponse: 'Görünür müdahale bu bölgede hızlı karşılık bulur.',
    negativeResponse: 'Gecikme algısı burada hızlı büyüyebilir.',
    riskWhenIgnored: 'Kaynak temposu düşerse sosyal nabız hızla artar.',
    mapLabel: 'Merkez Duyarlı',
    result: {
      positive: {
        title: 'Görünür müdahale karşılık buldu.',
        description: 'Bu bölgede hızlı ve görünür hizmet güveni daha çabuk toparlıyor.',
      },
      neutral: {
        title: 'Görünür hizmet izi kayda geçti.',
        description: 'Merkez duyarlılığı nedeniyle küçük aksiyonlar takip edilmeli.',
      },
      warning: {
        title: 'Görünürlük yetersiz kaldı.',
        description: 'Bu bölgede gecikme algısı hızlı büyüyebilir; tempo izlenmeli.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'görünür müdahaleye hızlı karşılık verdi. Yarın aynı tempoyu kaynakları yormadan sürdürmek önemli.',
      },
      neutral: {
        title: '',
        description:
          'görünür hizmet izi bıraktı. Kaynak temposunu dengede tutmak yarın için kritik.',
      },
      warning: {
        title: '',
        description:
          'gecikme algısı büyüyor. Görünür hizmet temposu yarın daha belirleyici olacak.',
      },
    },
    replay: {
      cityImpact: 'Merkez duyarlı bölgede görünür hizmet etkisi oluştu.',
      socialEcho: 'Mahalle görünür hizmeti fark etti.',
      maintenance: 'Görünür hazırlık sinyali yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} takipte.`,
      watchSubtitle: 'Görünür takip burada güven üretir.',
      positiveTitle: (name) => `${name} görünür hizmete yanıt verdi.`,
      positiveSubtitle: 'Güven toparlanıyor, kaynak temposu izlenmeli.',
    },
    eceHint:
      'Bu bölgede görünür müdahale hızlı güven üretir. Kaynak temposunu yine de izle.',
  },
  market_pressure: {
    label: 'Günlük Akış Hassas',
    shortTrait: 'Gecikme algısı hızlı büyür.',
    expectationLabel: 'Günlük akış sürekliliği',
    toleranceLabel: 'Düşük tolerans',
    reactsTo: ['gecikme', 'pazar akışı', 'iş temposu'],
    positiveResponse: 'Hızlı müdahale günlük akışı rahatlattı.',
    negativeResponse: 'Gecikme algısı burada hızlı büyür.',
    riskWhenIgnored: 'Rutin aksama sosyal tepkiyi hızlı büyütebilir.',
    mapLabel: 'Akış Hassas',
    result: {
      positive: {
        title: 'Günlük akış rahatladı.',
        description: 'Hızlı müdahale günlük akış baskısını kısa süreli yumuşattı.',
      },
      neutral: {
        title: 'Gecikme algısı izlenmeli.',
        description: 'Günlük akış hassasiyeti nedeniyle tempo kaybı hızlı yankı bulabilir.',
      },
      warning: {
        title: 'Gecikme algısı hâlâ izlenmeli.',
        description: 'Günlük akış hassasiyeti nedeniyle küçük gecikmeler sosyal nabzı büyütebilir.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'günlük akış baskısı kısa süreli yumuşadı. Yarın rutin hizmet görünürlüğü kritik kalacak.',
      },
      neutral: {
        title: '',
        description:
          'gecikme algısı izleniyor. Rutin hizmet görünürlüğü yarın daha belirleyici.',
      },
      warning: {
        title: '',
        description:
          'gecikme algısı hızlı büyüyor. Rutin hizmet görünürlüğü yarın daha kritik.',
      },
    },
    replay: {
      cityImpact: 'Günlük akış hassas bölgede tempo sinyali izlendi.',
      socialEcho: 'Pazar ve iş akışı müdahaleyi hızlı fark etti.',
      maintenance: 'Akış baskısı hazırlık sinyalini yarına taşıdı.',
    },
    feed: {
      watchTitle: (name) => `${name}'da hizmet beklentisi artıyor.`,
      watchSubtitle: 'Rutin aksama sosyal tepkiyi hızlı büyütebilir.',
      positiveTitle: (name) => `${name} akış baskısını yumuşattı.`,
      positiveSubtitle: 'Görünür tempo yarın da korunmalı.',
    },
    eceHint:
      'Gecikme algısı burada hızlı büyür. Planı sahada görünür kılman önemli.',
  },
  industrial_route: {
    label: 'Rota ve Hizmet Odaklı',
    shortTrait: 'Süreklilik tek hamleden daha değerlidir.',
    expectationLabel: 'Rota sürekliliği',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['rota aksaması', 'ekip temposu', 'operasyon düzeni'],
    positiveResponse: 'Düzenli saha akışı güven üretti.',
    negativeResponse: 'Rota aksaması güveni düşürür.',
    riskWhenIgnored: 'Tek seferlik görünürlük yeterli olmayabilir.',
    mapLabel: 'Rota Odaklı',
    result: {
      positive: {
        title: 'Rota akışı güçlendi.',
        description: 'Bu bölgede düzenli saha akışı tek hamleden daha güçlü etki yaratır.',
      },
      neutral: {
        title: 'Rota sürekliliği kritik.',
        description: 'Operasyon düzeni korunursa güven istikrarlı kalır.',
      },
      warning: {
        title: 'Rota sürekliliği kritik.',
        description: 'Bu bölgede düzenli saha akışı tek hamleden daha güçlü etki yaratır.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'rota akışı güçlendi. Yarın süreklilik tek hamleden daha değerli olacak.',
      },
      neutral: {
        title: '',
        description:
          'rota düzeni izleniyor. Süreklilik bu bölgede güveni taşıyacak.',
      },
      warning: {
        title: '',
        description:
          'rota baskısı sürüyor. Süreklilik yarın operasyonun ana kaldıracı olacak.',
      },
    },
    replay: {
      cityImpact: 'Rota odaklı bölgede süreklilik sinyali izlendi.',
      socialEcho: 'Operasyon düzeni mahallede fark edildi.',
      maintenance: 'Rota hazırlığı yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} rota baskısında.`,
      watchSubtitle: 'Süreklilik burada tek hamleden daha değerli.',
      positiveTitle: (name) => `${name} rota akışını toparladı.`,
      positiveSubtitle: 'Düzenli tempo güveni taşıyor.',
    },
    eceHint:
      'Rutin aksama sessiz risk üretir. Kriz yokken de görünür kal.',
  },
  family_residential: {
    label: 'Yaşam Kalitesi Odaklı',
    shortTrait: 'Güven yavaş oluşur; düzenli takip güçlü karşılık bulur.',
    expectationLabel: 'Yaşam alanı düzeni',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['temizlik', 'güvenlik', 'yaşam alanı'],
    positiveResponse: 'Düzenli takip güven üretti.',
    negativeResponse: 'Küçük bozulmalar algıyı etkileyebilir.',
    riskWhenIgnored: 'Tepki birikir; görünür izleme önemlidir.',
    mapLabel: 'Yaşam Odaklı',
    result: {
      positive: {
        title: 'Yaşam alanı sinyali güçlendi.',
        description: 'Güven yavaş oluşur; düzenli takip burada güçlü karşılık bulur.',
      },
      neutral: {
        title: 'Yaşam kalitesi izleniyor.',
        description: 'Küçük aksaklıklar algıyı etkileyebilir; tempo dengeli kalmalı.',
      },
      warning: {
        title: 'Yaşam alanı baskısı sürüyor.',
        description: 'Güven yavaş toparlanır; görünür takip duygusu önemli.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'yaşam alanı sinyali güçlendi. Düzenli takip yarın da sürmeli.',
      },
      neutral: {
        title: '',
        description:
          'yaşam kalitesi izleniyor. Küçük aksiyonların sürekliliği önemli.',
      },
      warning: {
        title: '',
        description:
          'yaşam alanı baskısı sürüyor. Görünür takip yarın kritik kalacak.',
      },
    },
    replay: {
      cityImpact: 'Yaşam odaklı bölgede düzen sinyali izlendi.',
      socialEcho: 'Mahalle hizmet düzenini fark etti.',
      maintenance: 'Yaşam alanı hazırlığı yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} Mahallesi takipte.`,
      watchSubtitle: 'Güven yavaş oluşur; görünür takip fayda sağlar.',
      positiveTitle: (name) => `${name} düzen sinyaline yanıt verdi.`,
      positiveSubtitle: 'Düzenli takip güveni taşıyor.',
    },
    eceHint:
      'Güven yavaş oluşur. Küçük aksiyonların sürekliliği burada önemli.',
  },
  trust_fragile: {
    label: 'Güveni Kırılgan',
    shortTrait: 'Güven hızlı kırılır, yavaş toparlanır.',
    expectationLabel: 'Güven sürekliliği',
    toleranceLabel: 'Düşük tolerans',
    reactsTo: ['gecikme', 'geçmiş olumsuzluk', 'takip eksikliği'],
    positiveResponse: 'Müdahale olumlu iz bıraktı.',
    negativeResponse: 'Güven kırılgan; takip duygusu önemli.',
    riskWhenIgnored: 'Tek hamle yetmez; görünür hizmet tekrarı gerekir.',
    mapLabel: 'Güven Kırılgan',
    result: {
      positive: {
        title: 'Kırılgan güven toparlanıyor.',
        description: 'Müdahale olumlu iz bıraktı, ancak güvenin kalıcı olması için takip gerekiyor.',
      },
      neutral: {
        title: 'Güven kırılgan.',
        description: 'Bu bölgede güven hızlı kırılır, yavaş toparlanır.',
      },
      warning: {
        title: 'Güven kırılgan.',
        description: 'Geçmiş baskı hatırlanıyor; görünür takip duygusu kritik.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'güven toparlanıyor ama kırılgan. Küçük aksiyonların sürekliliği önemli.',
      },
      neutral: {
        title: '',
        description:
          'güven kırılgan kalıyor. Takip duygusu yarın da sürmeli.',
      },
      warning: {
        title: '',
        description:
          'güven baskısı sürüyor. Tek hamle yetmez; görünür takip şart.',
      },
    },
    replay: {
      cityImpact: 'Güveni kırılgan bölgede takip etkisi oluştu.',
      socialEcho: 'Mahalle müdahaleyi temkinli karşıladı.',
      maintenance: 'Kırılgan güven nedeniyle hazırlık sinyali yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} Mahallesi takipte.`,
      watchSubtitle: 'Güven kırılgan; görünür takip fayda sağlar.',
      positiveTitle: (name) => `${name}'ta güven toparlanıyor.`,
      positiveSubtitle: 'Takip duygusu sürdürülmeli.',
    },
    eceHint:
      'Bu bölgede güven kırılgan. Tek hamle yetmez, takip duygusu gerekiyor.',
  },
  service_sensitive: {
    label: 'Hizmet Hassas',
    shortTrait: 'Hizmet görünürlüğü güvene doğrudan yansır.',
    expectationLabel: 'Hizmet görünürlüğü',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['temizlik', 'bakım', 'konteyner', 'rutin hizmet'],
    positiveResponse: 'Hizmet görünürlüğü güvene yansıdı.',
    negativeResponse: 'Rutin hizmet gecikmesi tepki üretir.',
    riskWhenIgnored: 'Bakım ve hazırlık sinyalleri görünür kalmalı.',
    mapLabel: 'Hizmet Hassas',
    result: {
      positive: {
        title: 'Hizmet görünürlüğü güvene yansıdı.',
        description: 'Temizlik ve bakım sinyalleri bu bölgede doğrudan güven algısını etkiliyor.',
      },
      neutral: {
        title: 'Hizmet sinyali izleniyor.',
        description: 'Rutin hizmet görünürlüğü bu bölgede güveni taşır.',
      },
      warning: {
        title: 'Hizmet baskısı sürüyor.',
        description: 'Bakım ve hazırlık sinyalleri yarın daha görünür olmalı.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'hizmet görünürlüğü güvene yansıdı. Hazırlık sinyalleri yarın da izlenmeli.',
      },
      neutral: {
        title: '',
        description:
          'hizmet sinyali izleniyor. Rutin görünürlük yarın kritik kalacak.',
      },
      warning: {
        title: '',
        description:
          'hizmet baskısı sürüyor. Bakım ve hazırlık yarın öne çıkmalı.',
      },
    },
    replay: {
      cityImpact: 'Hizmet hassas bölgede görünürlük etkisi oluştu.',
      socialEcho: 'Mahalle rutin hizmet sinyalini fark etti.',
      maintenance: 'Hizmet hassasiyeti nedeniyle hazırlık sinyali yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} hizmet baskısında.`,
      watchSubtitle: 'Rutin görünürlük burada güveni taşır.',
      positiveTitle: (name) => `${name} hizmet sinyaline yanıt verdi.`,
      positiveSubtitle: 'Görünür hazırlık fayda sağladı.',
    },
    eceHint:
      'Hizmet görünürlüğü burada doğrudan güvene yansır. Hazırlığı ihmal etme.',
  },
  routine_dependent: {
    label: 'Rutin Bağımlı',
    shortTrait: 'Rutin hizmet aksarsa risk sessizce büyür.',
    expectationLabel: 'Rutin süreklilik',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['rutin aksama', 'rota', 'hazırlık sinyali'],
    positiveResponse: 'Rutin tempo korundu.',
    negativeResponse: 'Sessiz birikim riski artar.',
    riskWhenIgnored: 'Kriz yokken bile görünür kalmak gerekir.',
    mapLabel: 'Rutin Baskı',
    result: {
      positive: {
        title: 'Rutin tempo korundu.',
        description: 'Süreklilik bu mahallede tek hamleden daha değerlidir.',
      },
      neutral: {
        title: 'Rutin sinyal izleniyor.',
        description: 'Rutin hizmet aksarsa risk sessizce büyür.',
      },
      warning: {
        title: 'Rutin baskı sürüyor.',
        description: 'Hazırlık ve rota sinyalleri yarın daha kritik.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'rutin tempo korundu. Yarın sessiz birikim riskine karşı görünür kal.',
      },
      neutral: {
        title: '',
        description:
          'rutin sinyal izleniyor. Hazırlık baskısı yarın belirleyici olabilir.',
      },
      warning: {
        title: '',
        description:
          'rutin baskı sürüyor. Sessiz risk yarın büyüyebilir.',
      },
    },
    replay: {
      cityImpact: 'Rutin bağımlı bölgede süreklilik sinyali izlendi.',
      socialEcho: 'Mahalle rutin hizmet temposunu izledi.',
      maintenance: 'Rutin hazırlık sinyali yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} rutin baskısında.`,
      watchSubtitle: 'Sessiz birikim riski izlenmeli.',
      positiveTitle: (name) => `${name} rutin temposunu korudu.`,
      positiveSubtitle: 'Süreklilik güveni taşıyor.',
    },
    eceHint:
      'Rutin aksama sessiz risk üretir. Kriz yokken de görünür kal.',
  },
  balanced_unknown: {
    label: 'Dengeli Bölge',
    shortTrait: 'Sosyal nabız ve hizmet görünürlüğü birlikte izlenmeli.',
    expectationLabel: 'Dengeli beklenti',
    toleranceLabel: 'Orta tolerans',
    reactsTo: ['sosyal nabız', 'hizmet görünürlüğü'],
    positiveResponse: 'Dengeli müdahale etkili oldu.',
    negativeResponse: 'Baskı sinyalleri birlikte izlenmeli.',
    riskWhenIgnored: 'Veri eksikliğinde tempo kaybı riski artar.',
    mapLabel: 'Dengeli Bölge',
    result: {
      positive: {
        title: 'Bölge sinyali olumlu.',
        description: 'Sosyal nabız ve hizmet görünürlüğü birlikte dengelendi.',
      },
      neutral: {
        title: 'Bölge sinyali izleniyor.',
        description: 'Sosyal nabız ve hizmet görünürlüğü birlikte izlenmeli.',
      },
      warning: {
        title: 'Bölge baskısı sürüyor.',
        description: 'Yarın ilk kontrolde bu bölgenin izi tekrar okunmalı.',
      },
    },
    report: {
      positive: {
        title: '',
        description:
          'dengeli bir yanıt verdi. Yarın sosyal nabız ve hizmet birlikte izlenmeli.',
      },
      neutral: {
        title: '',
        description:
          'sinyal izleniyor. Yarın dengeli tempo korunmalı.',
      },
      warning: {
        title: '',
        description:
          'baskı sürüyor. Yarın ilk kontrolde bölge izi tekrar okunmalı.',
      },
    },
    replay: {
      cityImpact: 'Bölge etkisi dengeli izlendi.',
      socialEcho: 'Mahalle müdahaleyi fark etti.',
      maintenance: 'Hazırlık sinyali yarına taşındı.',
    },
    feed: {
      watchTitle: (name) => `${name} takipte.`,
      watchSubtitle: 'Küçük aksiyon fark yaratabilir.',
      positiveTitle: (name) => `${name} sinyale yanıt verdi.`,
      positiveSubtitle: 'Dengeli tempo izlenmeli.',
    },
    eceHint: 'Sosyal nabız ve hizmet görünürlüğünü birlikte izle.',
  },
};

export const DISTRICT_ID_PERSONALITY_BASELINE: Partial<Record<string, DistrictPersonalityKey>> = {
  merkez: 'civic_core',
  cumhuriyet: 'civic_core',
  sanayi: 'market_pressure',
  istasyon: 'industrial_route',
  yesilvadi: 'family_residential',
};
