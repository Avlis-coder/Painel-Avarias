# Painel de não conformidades — Loja 30

## Visualizar neste computador

Extraia o ZIP e abra index.html no navegador. Mantenha todos os arquivos na mesma pasta. Não é necessário instalar programas ou executar uma compilação.

## Arquivos para publicação

O pacote contém um site estático: index.html, styles.css, app.js, core.js, data.js e icon.svg. Publique esses arquivos juntos, preservando os nomes e a estrutura da pasta. O arquivo .nojekyll acompanha o pacote para hospedagem estática.

## Base e cálculos

- Base de registros: registros de nc lj30.xls, período de 02/01/2026 a 30/10/2026.
- São 4.327 itens, 1.011 NCs distintas e 199 fornecedores agrupados pela razão social.
- Valor: quantidade × custo unitário, sem arredondamento intermediário. A linha totalizadora da origem foi excluída.
- A situação de cada item é apresentada como Tratado ou Com pendência, separadamente da situação da NC completa.
- Valor já tratado: soma do valor dos itens tratados. Valor dos itens com pendência: soma do valor dos itens que ainda têm pendência. Os dois valores seguem os filtros do painel.
- Uma NC está 100% tratada quando todos os seus itens já foram tratados: 621 NCs tratadas e 390 com alguma pendência.
- O gráfico mensal usa a data do registro. A planilha não informa a data de tratamento; a linha de NCs tratadas mostra a situação atual das NCs registradas em cada mês.
- O comparativo mensal mostra o valor nas barras, as NCs geradas na linha tracejada e as NCs totalmente tratadas na linha contínua. As duas quantidades usam a mesma escala e também aparecem lado a lado na tabela mensal.
- Origem: I = Interna / Depósito; A = Não conformidade na compra; F = Faltas; C = Divergência comercial; D = Devolução frente de loja.
- Categorias: vínculo Produto = CODMDLOG com a base mercadológica. Sete itens sem correspondência permanecem nos totais e aparecem como Sem categoria na base.

O arquivo data.js contém os dados do painel, incluindo fornecedores, produtos e custos. Esta é uma fotografia da planilha fornecida; o site não altera os registros nem se atualiza automaticamente.

## Recursos

Filtros de período, situação dos itens, fornecedor, origem, tipo, categoria e busca. Ranking de fornecedores por quantidade de NCs ou valor, consulta de registros, detalhes dos itens, exportação CSV do recorte e impressão da página atual.
