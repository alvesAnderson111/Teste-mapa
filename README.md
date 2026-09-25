# Quadra — protótipo de construção

Jogo de navegador em tela inteira, terreno branco contínuo de 32 × 32 unidades, sem grade e câmera isométrica fixa. Modelos derivados diretamente dos nove GLBs originais; as malhas e materiais são projetados em sprites isométricos no navegador para manter o jogo leve. Não requer WebGL ou bibliotecas externas.

## Jogar

https://alvesanderson111.github.io/Teste-mapa/

Escolha Residência, Comércio ou Indústria na barra inferior. Toque para posicionar um edifício no ponto escolhido, sem encaixe em grade. Arraste no terreno para distribuir vários edifícios na área e confira o orçamento. Confirme em Construir. Um toque seleciona um lote. Posições cuja caixa de ocupação cruza outra construção são ignoradas e não cobradas. A confirmação só funciona se houver saldo para todas as posições livres selecionadas.

Dois dedos movem/aproximam o mapa; o botão Mover mapa permite arrastar com um dedo. +/− ajustam o zoom e ⌂ centraliza. A cidade é salva no armazenamento local deste navegador, não na conta GitHub. Limpar os dados do navegador remove o progresso.

## Economia inicial

Saldo: $ 100.000. Residência: $ 5.000 + 1,5%; comércio: $ 8.000 + 2,5%; indústria: $ 12.000 + 4%. A taxa de terreno é uma cobrança única sobre o subtotal de construções livres, não um imposto periódico. Exemplo: 10 casas = $ 50.000 + $ 750 = $ 50.750. Cada edifício tem uma caixa de ocupação de 0,94 × 0,94 unidades. Suas posições aceitam coordenadas fracionárias. No arrasto, o espaçamento de 1,04 unidade é relativo à área escolhida, sem alinhamento a uma grade global. O sorteio escolhe uma das três variantes da categoria, sem garantia de distribuição uniforme em seleções pequenas.

Preços e taxas estão centralizados em engine.js. Ainda não há renda periódica, demolição ou expansão do orçamento.

## Arquivos

- index.html: interface responsiva
- engine.js: orçamento, seleção, ocupação e validação do salvamento
- game.js: entrada por toque, câmera e apresentação
- models.json: geometria dos nove modelos originais

Testes do motor: `node test-engine.cjs`. Cobrem orçamento de 10 casas, ausência de sobreposição, saldo insuficiente, compras sem alterações parciais, limites do mapa, arrasto invertido, variantes e validação de salvamento.

## Posição livre

A seleção e a colisão usam coordenadas contínuas. A prévia mostra as caixas somente durante a seleção; o chão não tem linhas de grade. Os salvamentos da versão anterior são migrados automaticamente, mantendo posições, variantes e dinheiro. A rotação é livre quando a opção de alinhamento com a rua está ativa (ângulos em passos de 15°).

## Ruas, avenidas e parques

Escolha Rua ou Avenida e arraste o dedo para desenhar. O traçado é suavizado por duas passagens de Chaikin. A prévia informa preço e conexões. Vias que se encontram ou cruzam compartilham acesso físico; não há tráfego ou simulação de rotas de cidadãos ainda. Pontas próximas se conectam à linha central de uma via existente.

Rua: largura 0,55 unidade e $ 350 por unidade de comprimento. Avenida: largura 1 e $ 650 por unidade. O custo considera o traçado suavizado. Vias e edifícios não podem se sobrepor; cruzamentos entre vias são permitidos.

Parque: desenhe um contorno; ao soltar, o polígono é fechado e suavizado. Custo $ 450 por unidade de área, manutenção $ 12 por unidade de área/mês, arredondados para cima. Árvores e bancos são distribuídos de forma determinística. Contornos que cruzam a si mesmos, prédios, vias ou parques são bloqueados. Não há influência em população/atratividade implementada ainda.

A manutenção é cobrada a cada mês. Se o saldo acabar, o restante é registrado como manutenção pendente; o saldo não fica negativo. Ainda não há renda tributária ou cobrança automática de pendências. Pause o calendário para planejar sem avançar meses.

Alinhar prédios à rua próxima é opcional: ajusta a posição, orientação e recuo. Colisões usam caixas conservadoras que cobrem o prédio rotacionado. Salvamentos anteriores são migrados para versão 3.

Verificações: `node test-engine.cjs` e `node test-infrastructure.cjs`.
