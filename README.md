# Resolve Aqui — protótipo funcional

Plataforma web para ouvidoria e gestão de reclamações de serviços públicos municipais (TCC, ADS, Fatec Itapetininga).
HTML + CSS + JavaScript puros, sem build. Abra `index.html` no navegador. Dados fictícios, salvos no localStorage.

## Contas de demonstração
| Perfil | E-mail | Senha |
|---|---|---|
| Cidadão | joao@gmail.com | 123456 |
| Ouvidoria | admin@itapetininga.sp.gov.br | admin123 |
| Câmara de Vereadores | vereador@camara.exemplo.gov.br | camara123 |

## Mapa: documentação -> protótipo
- UC01-03 listar/selecionar/comentar -> "Na minha região"
- UC04-07 minhas reclamações, meus dados -> "Minha conta"
- UC05 manter reclamação / registrar -> "Nova manifestação"
- UC08-11 login, recuperar acesso, cadastro, confirmação -> telas públicas
- UC12 relatórios (PDF/CSV) -> "Relatórios"
- UC13-15 usuários, notificações -> "Usuários"
- Problema de pesquisa (organizar relatos e subsidiar decisão/fiscalização) -> Painel, pontos recorrentes com índice, Painel de fiscalização (Legislativo)
- Metodologia (testes/validação) -> questionário "Avaliar o protótipo"

## Limites
Sem servidor/SQL (a camada `js/store.js` isola o acesso a dados), e-mails simulados na tela, senhas sem criptografia, gov.br e mapa não ativos.
