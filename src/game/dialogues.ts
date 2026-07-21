import type { CharacterId } from "./characters";

// Provocações curtas por personagem (PT-BR, tom militar/canino).
const CHALLENGES: Record<CharacterId, string[]> = {
  ranger: [
    "Disciplina vence instinto. Prepare-se.",
    "Missão simples: você no chão em 3 turnos.",
    "Sem rosnado. Só precisão.",
  ],
  brutus: [
    "Late alto, morde mais alto.",
    "Vou te transformar em petisco.",
    "Trincheira é meu quintal, filhote.",
  ],
  musa: [
    "Sou bruta, não bruta demais. Só o suficiente.",
    "Cheguei pra terminar antes do café.",
    "Meu soco chega antes do seu tiro.",
  ],
  ozzy: [
    "Você mira. Eu já pulei.",
    "Rápido demais pra sua bomba.",
    "Traz o osso, filhote — se conseguir.",
  ],
  negao: [
    "Reza, filhote. Hoje eu tô com fome.",
    "Vou te enterrar com honras. Ou sem.",
    "Cane Corso não late. Cane Corso encerra.",
  ],
  miu: [
    "Nove vidas. Você tem uma. Faz as contas.",
    "Purr… foi a última coisa que ele ouviu.",
    "Miau. Agora corre.",
  ],
};


const REPLIES: Record<CharacterId, string[]> = {
  ranger: [
    "Faça bonito. Ou faça rápido.",
    "Vamos ver esse plano em campo.",
    "Menos conversa. Mais tiro.",
  ],
  brutus: [
    "Rosnado bonito. Cadê a mordida?",
    "Cala a boca e atira.",
    "Vai chorar antes do terceiro turno.",
  ],
  musa: [
    "Traz café pra dois, então.",
    "Vou te devolver na coleira.",
    "Cansei de conversa. Bora.",
  ],
  ozzy: [
    "Pula alto. Cai mais alto.",
    "Corre, filhote. Só vai atrasar.",
    "Meu tiro te encontra no ar.",
  ],
  negao: [
    "Ronca à vontade. Vou calar na primeira.",
    "Traz reforço. Vai precisar.",
    "Fica quieto que dói menos.",
  ],
  miu: [
    "Fofo. Agora explode.",
    "Bonitinho o discurso. Ridículo o tiro.",
    "Fecha o olho. Melhor assim.",
  ],
};


// Determinístico por par + índice de mistura, com uma pitada aleatória.
export function pickDialogue(a: CharacterId, b: CharacterId): { challenge: string; reply: string } {
  const ch = CHALLENGES[a];
  const rp = REPLIES[b];
  const seed = (a.length * 7 + b.length * 13 + Math.floor(Math.random() * 999)) | 0;
  return {
    challenge: ch[seed % ch.length],
    reply: rp[(seed >> 3) % rp.length],
  };
}
