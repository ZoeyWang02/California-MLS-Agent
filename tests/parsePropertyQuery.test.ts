import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePropertyQuery } from "../src/nlp/parsePropertyQuery.js";

test("handbook example", () => {
  const f = parsePropertyQuery("Show me 3-bedroom condos in Irvine under $1.5M with a pool.");
  assert.equal(f.city, "Irvine");
  assert.equal(f.maxPrice, 1_500_000);
  assert.equal(f.beds, 3);
  assert.equal(f.type, "Condominium");
  assert.equal(f.pool, "True");
});

test("single family with view", () => {
  const f = parsePropertyQuery("Find single family homes in Newport Beach under 2.2m with view");
  assert.equal(f.city, "Newport Beach");
  assert.equal(f.maxPrice, 2_200_000);
  assert.equal(f.type, "SingleFamilyResidence");
  assert.equal(f.hasView, "True");
});

test("townhome baths", () => {
  const f = parsePropertyQuery("2.5 bath townhomes in Pasadena under 900k");
  assert.equal(f.city, "Pasadena");
  assert.equal(f.baths, 2.5);
  assert.equal(f.maxPrice, 900_000);
  assert.equal(f.type, "Townhouse");
});

test("sqft filter", () => {
  const f = parsePropertyQuery("Homes in San Diego with 1800 sqft under $1m");
  assert.equal(f.city, "San Diego");
  assert.equal(f.sqft, 1800);
  assert.equal(f.maxPrice, 1_000_000);
});

test("square feet with comma", () => {
  const f = parsePropertyQuery("Houses in Palo Alto with 2,400 square feet");
  assert.equal(f.city, "Palo Alto");
  assert.equal(f.sqft, 2400);
});

test("max hoa", () => {
  const f = parsePropertyQuery("Condos in Irvine under 800k HOA under $500");
  assert.equal(f.city, "Irvine");
  assert.equal(f.maxPrice, 800_000);
  assert.equal(f.maxHoa, 500);
});

test("land type", () => {
  const f = parsePropertyQuery("Land in Malibu under 3m");
  assert.equal(f.city, "Malibu");
  assert.equal(f.maxPrice, 3_000_000);
  assert.equal(f.type, "UnimprovedLand");
});

test("beds and baths", () => {
  const f = parsePropertyQuery("4 bedrooms 3 baths in Anaheim under $950k");
  assert.equal(f.city, "Anaheim");
  assert.equal(f.beds, 4);
  assert.equal(f.baths, 3);
});

test("no filters", () => {
  const f = parsePropertyQuery("hello there");
  assert.equal(f.city, undefined);
  assert.equal(f.maxPrice, undefined);
  assert.equal(f.beds, undefined);
});

test("pool without price", () => {
  const f = parsePropertyQuery("condos in Irvine with a pool");
  assert.equal(f.city, "Irvine");
  assert.equal(f.type, "Condominium");
  assert.equal(f.pool, "True");
});

test("k suffix price", () => {
  const f = parsePropertyQuery("homes in Fresno under 650k");
  assert.equal(f.city, "Fresno");
  assert.equal(f.maxPrice, 650_000);
});
