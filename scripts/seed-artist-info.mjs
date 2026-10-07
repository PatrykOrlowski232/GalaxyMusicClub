import mysql from "mysql2/promise";

const bios = {
  "DJ Pulsar":
    "Resident Galaxy. Techno z ostrym groove'em i energetycznymi dropami.",
  "Luna Wave":
    "Melodic house i deep sets — przestrzeń, wokale i ciepłe pady.",
  Kosmowave:
    "Synthwave / cosmic disco. Retro-futurystyczne brzmienie na parkiecie.",
  "Deep Drift":
    "Minimal i deep techno. Hipnotyczne pętle i powolne budowanie napięcia.",
  Aether:
    "Ambient techno i progressive. Atmosferyczne przejścia między piętrem a lounge.",
  "Night Frequency":
    "Club techno. Wysokie BPM, dark bass i nocny drive.",
  "Violet Circuit":
    "Electro / bass. Neonowe melodie i ciężkie low-endy.",
  Nova: "Pop-club edits i peak-time bangers. Lineup headliner.",
  "Pulse Theory": "Tech-house. Groove, perkusja i czyste dropy.",
  "Bass Nova": "UKG / bassline. Bounce i wokalowe hooks.",
  Gravity: "Hard techno. Industrialne tekstury i mocny kick.",
  "Orbit Crew":
    "Back-to-back set. Eclectic club — house, breaks, techno.",
  "Solar Flare":
    "Peak-time techno. Jasne synthy i duże momenty na parkiecie.",
  "Dark Matter":
    "Dark progressive. Głęboki bass i cinematic builds.",
  Resonance:
    "Melodic techno. Emocjonalne linie i długie przejścia.",
};

const conn = await mysql.createConnection(
  process.env.DATABASE_URL ?? "mysql://galaxy:galaxy@127.0.0.1:3306/galaxy",
);

for (const [name, info] of Object.entries(bios)) {
  await conn.execute(
    "UPDATE artists SET info = ?, description = ? WHERE name = ?",
    [info, info, name],
  );
}

const [rows] = await conn.query(
  "SELECT id, name, info FROM artists ORDER BY id",
);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
