Dinamik Ön Yazı (Cover Letter) Oluşturucu: Şu an CV analizi ve yetenek eşleştirme var. Bunu bir adım ileri taşıyarak, spesifik bir iş ilanının gereksinimlerine (Job Description) ve kullanıcının CV'sine göre otomatik, kişiselleştirilmiş bir ön yazı taslağı üretebilirsin. Extensiona da eklemeyi unutma.

CV Optimizasyon Önerileri: Kullanıcı "Apply" demeden önce AI, "Bu ilan için CV'nde X yeteneğini vurgulaman eşleşme oranını %15 artırır" gibi eyleme geçirilebilir geri bildirimler sunabilir.

2. Chrome Eklentisi (Chrome Extension) Güçlendirmeleri
Otomatik Form Doldurma (Auto-fill): Eklenti sadece ilanı veritabanına kaydetmekle kalmayıp, kullanıcının HuntIQ profilindeki verileri kullanarak Greenhouse, Lever, Workday gibi popüler başvuru sistemlerindeki formları tek tıkla doldurabilir.

Interviewlar schedule olduğunda ne zamana olduğuna dair bir veri tutmuyoruz.

Otomatik Oturum Açma (Seamless Auth): Kullanıcı Next.js web uygulamasında (HuntIQ ana sitesi) giriş yaptıysa, eklenti chrome.cookies API'sini kullanarak bu oturumu (NextAuth session token) otomatik olarak tanımalı. Eklenti içinde tekrar OTP girmesine kesinlikle gerek kalmamalı.

Optimal Çözüm (Beta ve Sonrası Stratejisi):

Beta Süreci (Senin Yönetimin): Dediğin gibi beta sürecinde kendi API anahtarlarını kullanmalısın. Ancak bu anahtarlar asla frontend'de veya eklentide olmamalı. İstekler senin Next.js API rotalarına (/api/ai/...) gelmeli, senin sunucun Groq/Claude ile haberleşip sonucu frontend'e dönmeli.

Kota / Rate Limit Sistemi (Zorunlu): Kendi API anahtarını kullanacağın için kötüye kullanımı (abuse) engellemen şart. Her kullanıcıya örneğin "Aylık 50 AI İşlemi" limiti koy (Upstash Redis + Next.js Middleware ile rate limiting çok kolaydır).


Örnek Veri (Dummy Data): Kullanıcı ilk kez giriş yaptığında bomboş bir Kanban board ve Dashboard görmemeli. Otomatik olarak yaratılmış 2-3 sahte iş başvurusu (birisi mülakat aşamasında, diğeri reddedilmiş vb.) göster. Böylece ürünün dolu halinin ne kadar güzel gözüktüğünü anında fark ederler.


flow şu olmalı:

Siteye gir -> Sadece Email yaz -> OTP gir. (Giriş yapıldı)

Yönlendirme: "Eklentiyi Kur". (Eklenti kurulduğunda site session'ını otomatik tanır).

LinkedIn'e git, bir ilana bak -> İlanın üstünde beliren HuntIQ butonuna bas. (İşlem tamam!)