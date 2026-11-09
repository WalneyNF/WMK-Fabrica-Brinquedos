# WMK Fábrica de Brinquedos

Protótipo jogável em **HTML, CSS e JavaScript** de uma fábrica infantil de brinquedos.

## Ideia

O jogador recebe o pedido de um cliente e precisa montar um brinquedo passando por 4 estações:

- **Corpo**
- **Pintura**
- **Roupa**
- **Acessório**

Depois disso, pode testar o brinquedo e entregá-lo para ganhar pontos.

## Recursos desta versão

- Interface colorida inspirada em jogos infantis de montagem.
- Pedidos aleatórios.
- 4 tipos de corpo: Urso, Robô, Foguete e Carrinho.
- 6 cores.
- 4 roupas.
- 4 acessórios.
- Pontuação, vidas, tempo e recorde.
- 3 dificuldades.
- Dados externos em JSON.
- Pronto para GitHub Pages.

## Estrutura

- `index.html` — jogo principal
- `style.css` — layout e visual
- `app.js` — lógica do jogo
- `data/game-data.json` — corpos, cores, roupas, acessórios e dificuldades
- `data/game-data.js` — fallback para abrir sem servidor

## Como testar

Abra o `index.html` no navegador ou publique o projeto no GitHub Pages.

## Créditos

**Walney Moreira Klein — walneyk@hotmail.com**

## v0.2 — Correções de layout

- Painéis e fontes reduzidos para notebooks.
- Máquinas organizadas em uma grade 2 × 2 para evitar corte lateral.
- Esteira e brinquedo em área reservada, sem cobrir botões ou mensagens.
- Layout adaptado para celulares e tablets.
