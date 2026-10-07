import mysql from "mysql2/promise";

const map = {
  "DJ Pulsar": "/artists/dj-pulsar.svg",
  "Luna Wave": "/artists/luna-wave.svg",
  Kosmowave: "/artists/kosmowave.svg",
  "Deep Drift": "/artists/deep-drift.svg",
  Aether: "/artists/aether.svg",
  "Night Frequency": "/artists/night-frequency.svg",
  "Violet Circuit": "/artists/violet-circuit.svg",
  Nova: "/artists/nova.svg",
  "Pulse Theory": "/artists/pulse-theory.svg",
  "Bass Nova": "/artists/bass-nova.svg",
  Gravity: "/artists/gravity.svg",
  "Orbit Crew": "/artists/orbit-crew.svg",
  "Solar Flare": "/artists/solar-flare.svg",
  "Dark Matter": "/artists/dark-matter.svg",
  Resonance: "/artists/resonance.svg",
};

const c = await mysql.createConnection(
  process.env.DATABASE_URL ?? "mysql://galaxy:galaxy@127.0.0.1:3306/galaxy",
);

for (const [name, photo] of Object.entries(map)) {
  await c.execute("UPDATE artists SET photo_url = ? WHERE name = ?", [
    photo,
    name,
  ]);
}

const [rows] = await c.query(
  "SELECT id, name, photo_url FROM artists ORDER BY id",
);
console.log(JSON.stringify(rows, null, 2));
await c.end();
