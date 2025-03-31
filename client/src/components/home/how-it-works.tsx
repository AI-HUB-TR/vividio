import { Check } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Giriş Yapın",
      description: "Email, Google, GitHub, Apple, Facebook veya Twitter hesabınızla hızlıca giriş yapın."
    },
    {
      number: 2,
      title: "Metninizi Girin",
      description: "Metninizi yazın, sistem otomatik olarak bölümlere ayıracaktır."
    },
    {
      number: 3,
      title: "Video Oluşturun",
      description: "Yapay zeka görsel, ses ve altyazıları ekleyerek videonuzu oluşturur."
    },
    {
      number: 4,
      title: "İndirin ve Paylaşın",
      description: "Oluşturulan videoyu indirin veya direkt sosyal medyada paylaşın."
    }
  ];

  return (
    <div className="bg-secondary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl">
        <div className="text-center">
          <h2 className="text-base font-semibold tracking-wider text-primary uppercase">
            NASIL ÇALIŞIR
          </h2>
          <p className="mt-2 text-3xl font-display font-bold text-foreground sm:text-4xl">
            Sadece 4 adımda video oluşturun
          </p>
          <p className="mt-5 max-w-prose mx-auto text-xl text-muted-foreground">
            VidAI ile video oluşturmak hiç bu kadar kolay olmamıştı.
          </p>
        </div>
        
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="mt-6 text-lg font-display font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
