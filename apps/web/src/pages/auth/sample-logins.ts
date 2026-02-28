const DOCTOR_EMAILS = [
  "hans.mueller@gmail.com",
  "anna.schmidt@gmail.com",
  "klaus.fischer@gmail.com",
  "petra.weber@gmail.com",
  "wolfgang.wagner@gmail.com",
  "sabine.becker@gmail.com",
  "juergen.hoffmann@gmail.com",
  "monika.schaefer@gmail.com",
  "dieter.koch@gmail.com",
  "ursula.richter@gmail.com",
  "thomas.klein@gmail.com",
  "brigitte.wolf@gmail.com",
  "helmut.schroeder@gmail.com",
  "renate.neumann@gmail.com",
  "gerhard.schwarz@gmail.com",
  "ingrid.zimmermann@gmail.com",
  "manfred.braun@gmail.com",
  "erika.krueger@gmail.com",
  "friedrich.hartmann@gmail.com",
  "hildegard.lange@gmail.com",
];

const PATIENT_EMAILS = [
  "max.mustermann@gmail.com",
  "sophie.bauer@gmail.com",
  "lukas.huber@gmail.com",
  "lena.maier@gmail.com",
  "felix.schulz@gmail.com",
  "marie.frank@gmail.com",
  "paul.berger@gmail.com",
  "laura.winkler@gmail.com",
  "jonas.lorenz@gmail.com",
  "hannah.baumann@gmail.com",
  "leon.herrmann@gmail.com",
  "mia.koenig@gmail.com",
  "tim.walter@gmail.com",
  "klara.mayer@gmail.com",
  "niklas.kaiser@gmail.com",
  "emma.fuchs@gmail.com",
  "benjamin.scholz@gmail.com",
  "johanna.moeller@gmail.com",
  "david.peters@gmail.com",
  "lina.sommer@gmail.com",
  "elias.vogt@gmail.com",
  "amelie.stein@gmail.com",
  "anton.jansen@gmail.com",
  "charlotte.brandt@gmail.com",
  "moritz.haas@gmail.com",
  "greta.schreiber@gmail.com",
  "oskar.graf@gmail.com",
  "frieda.dietrich@gmail.com",
  "karl.werner@gmail.com",
  "ida.roth@gmail.com",
];

export const SAMPLE_PASSWORD = "Test@123";

export interface SampleLoginGroup {
  label: string;
  emails: readonly string[];
}

export const SAMPLE_LOGIN_GROUPS: SampleLoginGroup[] = [
  { label: "Admin", emails: ["admin@gmail.com"] },
  { label: "Doctor", emails: DOCTOR_EMAILS },
  { label: "Patient", emails: PATIENT_EMAILS },
];
