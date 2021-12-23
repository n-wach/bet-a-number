import {randomInt} from "crypto";
import * as fs from "fs";
import path from "path";

function getLines(file: string): string[] {
  const relpath = path.resolve(__dirname, file);
  const buffer = fs.readFileSync(relpath);
  return buffer.toString().split(/\r?\n/);
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const adjectives: string[] = getLines("adjectives.txt");
const nouns: string[] = getLines("nouns.txt");

export function randomAdjective(): string {
  return randomItem(adjectives);
}

export function randomNoun() {
  return randomItem(nouns);
}

