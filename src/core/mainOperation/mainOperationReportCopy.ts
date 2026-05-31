export type MainOperationReportLinePool = {
  id: string;
  domain: string;
  line: string;
};

export const MAIN_OPERATION_REPORT_LINE_POOL: MainOperationReportLinePool[] = [
  { id: 'r1', domain: 'season', line: 'Sezon hedeflerinde şehir dengesi korunuyor; araç sinyali yarın izlenmeli.' },
  { id: 'r2', domain: 'assignment', line: 'Güçlü saha atamaları kriz riskini düşürdü.' },
  { id: 'r3', domain: 'district', line: 'Sanayi aktif kapsama geçtiği için filo baskısı daha görünür hale geldi.' },
  { id: 'r4', domain: 'district', line: 'Yeşilvadi hâlâ gündem aşamasında; çevre hassasiyeti sonraki günlerde artabilir.' },
  { id: 'r5', domain: 'container', line: 'Konteyner temizlik odağı sosyal tepkiyi yumuşattı.' },
  { id: 'r6', domain: 'crisis', line: 'Kriz eşiği kontrol altına alındı; çoklu mahalle baskısı dağıldı.' },
  { id: 'r7', domain: 'plan', line: 'Günlük plan etkisi filo ve konteyner sinyallerini dengeledi.' },
  { id: 'r8', domain: 'assignment', line: 'Zayıf atama uyumu mahalle baskısını büyüttü; yarın uyum gözden geçirilmeli.' },
  { id: 'r9', domain: 'vehicle', line: 'Filo dengesi sezon hedefinde yavaşladı; bakım rotası plana yazıldı.' },
  { id: 'r10', domain: 'social', line: 'Sosyal tepki hattı sakinleşti; halk odaklı karar etkili oldu.' },
  { id: 'r11', domain: 'season', line: 'Mahalle kapsamı genişledi; gündem hatları netleşiyor.' },
  { id: 'r12', domain: 'district', line: 'Merkez görünür hizmet baskısı kısa sürede yönetildi.' },
  { id: 'r13', domain: 'district', line: 'Cumhuriyet gece şikayeti hattı izlemede kaldı.' },
  { id: 'r14', domain: 'crisis', line: 'Şehir baskısı izleme seviyesinde; kriz sinyali sınırlı kaldı.' },
  { id: 'r15', domain: 'plan', line: 'Önleyici hamle yarınki operasyon yükünü hafifletti.' },
  { id: 'r16', domain: 'assignment', line: 'Saha ataması uyumu sezon hedefini destekledi.' },
  { id: 'r17', domain: 'container', line: 'Konteyner ağında kapasite eşiği yaklaştı; Sanayi hattı öncelikli.' },
  { id: 'r18', domain: 'vehicle', line: 'Araç ve konteyner sinyali aynı hatta birleşmedi; plan işe yaradı.' },
  { id: 'r19', domain: 'social', line: 'Mahalle temsilcisi bilgilendirmeyi olumlu karşıladı.' },
  { id: 'r20', domain: 'season', line: 'Sezon günü ilerledikçe aktif mahalle sayısı arttı.' },
  { id: 'r21', domain: 'district', line: 'İstasyon aktarma hattında gecikme kısaldı.' },
  { id: 'r22', domain: 'crisis', line: 'Kriz Masası uyarısı saha kararıyla yumuşadı.' },
  { id: 'r23', domain: 'plan', line: 'Günlük plan çelişkisi giderildi; rota odağı netleşti.' },
  { id: 'r24', domain: 'assignment', line: 'Koordinasyon riski güçlü atamayla düştü.' },
  { id: 'r25', domain: 'vehicle', line: 'Filo rotasyonu operasyon dengesini korudu.' },
  { id: 'r26', domain: 'container', line: 'Çoklu mahalle konteyner baskısı dağıtıldı.' },
  { id: 'r27', domain: 'social', line: 'Halk odaklı yaklaşım sosyal baskıyı azalttı.' },
  { id: 'r28', domain: 'season', line: 'Şehir dengesi hedefi ilerleme kaydetti.' },
  { id: 'r29', domain: 'district', line: 'Önizleme mahallelerde yumuşak sinyal izleniyor.' },
  { id: 'r30', domain: 'plan', line: 'Kapasite ve bakım dengesi günlük planda korundu.' },
  { id: 'r31', domain: 'crisis', line: 'Kritik eşik yaklaşmadı; şehir baskısı kontrollü.' },
  { id: 'r32', domain: 'assignment', line: 'Atama uyumu zayıf kalan olay sayısı düşük.' },
  { id: 'r33', domain: 'limited', line: 'Sınırlı gündemde sezon hedefleri dar kapsamda izlenir.' },
];

export function pickMainOperationReportLines(params: {
  day: number;
  isFull: boolean;
  maxLines?: number;
}): string[] {
  const max = params.maxLines ?? 3;
  if (!params.isFull) {
    const limited = MAIN_OPERATION_REPORT_LINE_POOL.filter((l) => l.domain === 'limited');
    return [limited[0]?.line ?? 'Sınırlı gündemde operasyon sinyalleri izlenir.'].slice(0, max);
  }
  const pool = MAIN_OPERATION_REPORT_LINE_POOL.filter((l) => l.domain !== 'limited');
  const lines: string[] = [];
  for (let i = 0; i < max; i += 1) {
    const entry = pool[(params.day + i * 7) % pool.length];
    if (entry && !lines.includes(entry.line)) {
      lines.push(entry.line);
    }
  }
  while (lines.length < max && pool.length > 0) {
    const entry = pool[lines.length % pool.length]!;
    if (!lines.includes(entry.line)) {
      lines.push(entry.line);
    } else {
      break;
    }
  }
  return lines.slice(0, max);
}

export function countMainOperationReportLines(): number {
  return MAIN_OPERATION_REPORT_LINE_POOL.length;
}
