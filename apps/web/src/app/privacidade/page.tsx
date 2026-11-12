import Link from "next/link";
import { SiteChrome } from "@/components/site-chrome";

export default function PrivacidadePage() {
  return (
    <SiteChrome maxWidth={760} padding="1.25rem 0 3rem">
      <article className="panel" style={{ padding: "1.75rem", display: "grid", gap: "1rem", lineHeight: 1.55 }}>
        <h1 className="brand" style={{ margin: 0, fontSize: "2rem" }}>
          Política LGPD e privacidade
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Esta política descreve como tratamos dados pessoais e tecnologias no seu navegador (como
          cookies e armazenamento local) nos sites e aplicações da plataforma Alamino, em conformidade
          com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>
        <section>
          <h2>1. Quem é o responsável</h2>
          <p className="muted">
            O operador do site ou serviço que você está utilizando (POC Hábitos / Alamino Code Solutions)
            é o responsável pelo tratamento dos dados coletados por meio deste ambiente. Para exercer
            seus direitos, utilize os canais de contato em{" "}
            <Link href="/contrate-me">/contrate-me</Link> ou em{" "}
            <a href="https://alamino.dev.br/" target="_blank" rel="noreferrer">
              alamino.dev.br
            </a>
            , quando aplicável.
          </p>
        </section>
        <section>
          <h2>2. O que são cookies e localStorage</h2>
          <p className="muted">
            Cookies são pequenos arquivos ou registros enviados ao navegador para memorizar preferências,
            manter sessão autenticada, medir audiência ou melhorar desempenho. O localStorage (e
            armazenamento semelhante) guarda dados no seu aparelho até que você apague — por exemplo,
            para lembrar que você aceitou esta política ou preferências da interface.
          </p>
        </section>
        <section>
          <h2>3. Finalidades e bases legais</h2>
          <p className="muted">
            Utilizamos essas tecnologias para: (i) execução de contrato ou procedimentos preliminares
            (ex.: sessão logada); (ii) legítimo interesse, observado seu direito à privacidade (ex.:
            segurança, prevenção a fraudes, melhoria de estabilidade); (iii) consentimento, quando
            exigido (ex.: preferências opcionais ou cookies não essenciais, conforme o caso).
            Finalidades específicas podem constar em avisos complementares de cada produto.
          </p>
        </section>
        <section>
          <h2>4. Dados tratados</h2>
          <p className="muted">
            Podem incluir identificadores técnicos (IP, tipo de navegador, páginas acessadas), registros
            de consentimento, tokens de sessão e dados que você mesmo insere nos formulários. Não
            vendemos seus dados pessoais.
          </p>
        </section>
        <section>
          <h2>5. Seus direitos (art. 18 da LGPD)</h2>
          <ul className="muted">
            <li>confirmar a existência de tratamento e acessar seus dados;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>
              solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
              desconformidade;
            </li>
            <li>pedir portabilidade, quando aplicável;</li>
            <li>
              revogar consentimento e solicitar revisão de decisões automatizadas, quando houver.
            </li>
          </ul>
        </section>
        <section>
          <h2>6. Como exercer seus direitos</h2>
          <p className="muted">
            Entre em contato pelos canais divulgados no site. Poderemos solicitar informações mínimas
            para confirmar sua identidade. Você também pode gerenciar ou apagar dados armazenados
            localmente nas configurações do navegador (cookies e dados do site).
          </p>
        </section>
        <section>
          <h2>7. Retenção e segurança</h2>
          <p className="muted">
            Mantemos dados pelo tempo necessário às finalidades informadas ou para cumprimento de
            obrigação legal. Adotamos medidas técnicas e administrativas razoáveis para proteger as
            informações contra acessos não autorizados e incidentes.
          </p>
        </section>
        <section>
          <h2>8. Atualizações</h2>
          <p className="muted">
            Esta política pode ser atualizada. Alterações relevantes serão comunicadas de forma
            apropriada (por exemplo, novo aviso no site).
          </p>
        </section>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Texto informativo. Em caso de dúvida jurídica específica, consulte um profissional habilitado.
        </p>
      </article>
    </SiteChrome>
  );
}
