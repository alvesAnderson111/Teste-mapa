# Quadra — protótipo de construção

Jogo de navegador em tela inteira, terreno branco de 32 × 32 lotes e câmera isométrica fixa. Modelos derivados diretamente dos nove GLBs originais; as malhas e materiais são projetados em sprites isométricos no navegador para manter o jogo leve. Não requer WebGL ou bibliotecas externas.

## Jogar

https://alvesanderson111.github.io/Teste-mapa/

Escolha Residência, Comércio ou Indústria na barra inferior. Arraste no terreno para selecionar um retângulo de lotes e confira o orçamento. Confirme em Construir. Um toque seleciona um lote. Lotes ocupados são ignorados e não cobrados. A confirmação só funciona se houver saldo para todos os lotes livres selecionados.

Dois dedos movem/aproximam o mapa; o botão Mover mapa permite arrastar com um dedo. +/− ajustam o zoom e ⌂ centraliza. A cidade é salva no armazenamento local deste navegador, não na conta GitHub. Limpar os dados do navegador remove o progresso.

## Economia inicial

Saldo: $ 100.000. Residência: $ 5.000 + 1,5%; comércio: $ 8.000 + 2,5%; indústria: $ 12.000 + 4%. A taxa de terreno é uma cobrança única sobre o subtotal de construções livres, não um imposto periódico. Exemplo: 10 casas = $ 50.000 + $ 750 = $ 50.750. Cada edifício ocupa um lote exclusivo; sua malha é dimensionada para caber dentro da caixa do lote, com margem. O sorteio escolhe uma das três variantes da categoria, sem garantia de distribuição uniforme em seleções pequenas.

Preços e taxas estão centralizados em engine.js. Ainda não há renda periódica, demolição ou expansão do orçamento.

## Arquivos

- index.html: interface responsiva
- engine.js: orçamento, seleção, ocupação e validação do salvamento
- game.js: entrada por toque, câmera e apresentação
- models.json: geometria dos nove modelos originais

Testes do motor: `node test-engine.cjs`. Cobrem orçamento de 10 casas, ausência de sobreposição, saldo insuficiente, compras sem alterações parciais, limites do mapa, arrasto invertido, variantes e validação de salvamento.
