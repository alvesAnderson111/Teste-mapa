# Mapa Vivo

Gerador de mundos 3D simplificados para navegador, com WebGL e sem dependências externas.

## Experimentar

1. Escolha a paisagem, água e relevo.
2. Toque em **Gerar outro mapa** para aplicar as opções.
3. Toque em **Entrar no mapa** para explorar o mesmo mundo em tela cheia da página.

Arraste para mover a câmera, use dois dedos para zoom ou os botões +/−. ↻ gira a câmera; ⌂ mostra o mundo inteiro. **Gerador** volta sem trocar a semente. No computador, a roda do mouse ajusta o zoom e Escape volta ao gerador.

## Escopo

Terreno tridimensional, mar, leito de rio, areia, grama, rochas e árvores de poucos polígonos. A semente permanece ao entrar, voltar e mover a câmera. As opções só são aplicadas ao gerar novamente. Recarregar a página gera um novo mundo; ainda não há salvamento.

Base de exploração, ainda sem personagens, construções, estradas, objetivos ou colisões. Requer navegador com WebGL. Não usa bibliotecas ou CDN.

## Publicação

No GitHub Pages, selecione Deploy from a branch, main e /(root). Endereço esperado: https://alvesanderson111.github.io/Teste-mapa/

## Verificação desta versão

Sintaxe JavaScript validada. Testes com contexto WebGL simulado verificaram geometria finita em 16 combinações extremas e preservação do mundo durante entrada, volta e câmera. Esses testes não substituem validação visual na GPU ou teste de toque em aparelho físico.
