# Regras de trabalho (Edubolsas)

## Decisões e pendências
- Decisões (perguntas com opções) são feitas aqui no chat, nunca no painel.
- Só vão para o painel https://claude.ai/artifact/3LDzKKNPurBtqcJa3RCQf4 as pendências:
  o que ficou dependendo da Lívia depois da conversa (tarefas a fazer, prazos, agendamentos).
- No painel, pendências entram na coleção `prioridades` (campos: texto, area, prazo AAAA-MM-DD,
  feito=false, ordem, links [{texto,url}]), via ArtifactData. Não criar documentos em `decisoes`.
- Quando a pendência for resolvida, marcar `feito=true` em vez de apagar.

## Contexto deste repositório
- Este repositório só contém o redirecionamento da loja antiga (edubolsasstore.com.br) para
  www.edubolsas.com.br e o feed de inventário local do Merchant Center (Netlify edge function).
- A loja em si roda no Magazord, fora do GitHub.

## E-mail da empresa
- Todo e-mail em nome da Edubolsas sai de um endereço @edubolsas.com.br (hoje livia@edubolsas.com.br,
  caixa na Hostinger), nunca do Gmail edubolsas.site@gmail.com. O Gmail serve só para conectores
  e para receber cópias; quando a caixa da Hostinger estiver ligada ao Gmail, rascunhos saem com
  "Enviar como" livia@edubolsas.com.br.
