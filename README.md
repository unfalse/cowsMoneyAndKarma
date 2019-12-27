# Cows Money And Karma Tycoon

A game which I wrote in two days while participating in [KrassJAM](https://itch.io/jam/krassjam11). It's the kind of a hackathon which ran from November 29th to December 2nd.

Due to a very short time for implementation I put all of the code into `game.js` and only some low-level routines into `utils.js`. So it's a kind of speed coding.

## Idea of the game

The main concept of the game was randomly generated on the specialized website and it looks like this: "A tycoon game where you monetize livestock to score karma." So it's a simple 2D that is contained cells where you can move the main hero. The main goal is to collect as many cows as you can and to decrease your debt to zero while staying healthy.

### Controls

Arrow keys.

## Installation and running

Production minified build:
```
yarn
yarn build
```
Open `dist\index.html`

For development build open `src\index.html`

## Technologies used

Just the vanilla JS, HTML and CSS.