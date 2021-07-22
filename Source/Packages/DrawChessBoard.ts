import { join } from "path";
import { Chess } from "chess.js";
import { createCanvas, loadImage } from "canvas";
import { writeFileSync } from "fs";

// Configuration Stuff
const black = "pbnrqk";

const defaultSize = 480;

const defaultLight = "rgb(240, 217, 181)";

const defaultDark = "rgb(181, 136, 99)";

const defaultStyle = "merida";

const filePaths = {
	wp: "WhitePawn",
	bp: "BlackPawn",
	wb: "WhiteBishop",
	bb: "BlackBishop",
	wn: "WhiteKnight",
	bn: "BlackKnight",
	wr: "WhiteRook",
	br: "BlackRook",
	wq: "WhiteQueen",
	bq: "BlackQueen",
	wk: "WhiteKing",
	bk: "BlackKing",
};

export default class ChessImageGenerator {
	private size: number = defaultSize;
	private light: string = defaultLight;
	private dark: string = defaultDark;
	private style: string = defaultStyle;
	private chess = new Chess();
	private ready: boolean = false;

	constructor(options?: {
		size?: number;
		light?: string;
		dark?: string;
		style?: string;
	}) {
		Object.assign(
			this,
			options,
		);
	}

	public loadFEN(fen: string) {
		if(!this.chess.load(fen)) throw new Error("FEN could not be read successfully.");

		this.ready = true;
		return this;
	}

	public async generateBuffer() {
		if(!this.ready) throw new Error("The position hasn't been loaded yet!");

		// The canvas has to be a square
		const canvas = createCanvas(this.size, this.size);
		const ctx = canvas.getContext("2d");

		ctx.beginPath();
		ctx.rect(0, 0, this.size, this.size);
		ctx.fillStyle = this.light;
		ctx.fill();

		for(let i = 0; i < 8; i += 1) {
			for(let j = 0; j < 8; j += 1) {
				if(
					(i + j) % 2 === 0
				) {
					ctx.beginPath();
					ctx.rect(
						(this.size / 8) * (7 - j + 1) - this.size / 8,
						(this.size / 8) * i,
						this.size / 8,
						this.size / 8,
					);

					ctx.fillStyle = this.dark;
					ctx.fill();
				}

				const piece = this.chess.board()[i][j];
				if(
					piece && black.includes(piece.type.toLowerCase())
				) {
					// @ts-ignore
					const image = `../../Assets/Images/Chess/${this.style}/${filePaths[`${piece.color}${piece.type}`]}.png`;
					const imageFile = await loadImage(join(__dirname, image));
					const data = createCanvas(imageFile.width, imageFile.height);
					const dataCtx = data.getContext("2d");
					dataCtx.drawImage(imageFile, 0, 0);
					// @ts-ignore
					writeFileSync(`${filePaths[`${piece.color}${piece.type}`]}.png`, data.toBuffer("image/png"));

					await ctx.drawImage(
						imageFile,
						(this.size / 8) * (7 - j + 1) - this.size / 8,
						(this.size / 8) * i,
						this.size / 8,
						this.size / 8,
					);
				}
			}
		}

		return canvas.toBuffer();
	}
};