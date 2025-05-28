// Recursos do jogador
let moedas = 0;
let sementes = 0;

// Entidades do jogo
let plantas = [];
let personagem;
let insetos = [];
let efeitosVisuais = [];
let soloArado = [];

// Mensagens e estados
let mensagem = "";
let mensagemCentral = "";
let estadoMensagem = "inicio";

// Temporizador
let tempoRestante = 0;
let temporizadorAtivo = false;
let iniciarContagem = false;
let tempoMensagem = 0;

function setup() {
  createCanvas(800, 600);
  personagem = new Personagem(50, height - 180);

  for (let i = 0; i < 3; i++) {
    insetos.push({
      x: random(300, 500),
      y: random(height - 180, height - 140),
      dirX: random([-1, 1]),
      dirY: random([-1, 1]),
      speed: random(0.3, 0.6),
      tipo: random(["🐝", "🦋"]),
    });
  }
}

function draw() {
  background(135, 206, 235);

  for (let x = 0; x < width; x += 20) {
    if (soloArado.includes(floor(x / 20))) {
      fill(205, 133, 63); // solo arado
    } else {
      fill(34, 139, 34); // grama
    }
    rect(x, height - 150, 20, 150);
  }

  desenharCasaDeSementes();

  fill(0);
  textSize(20);
  textAlign(LEFT);
  text(`Moedas: ${moedas}`, 20, 30);
  text(`Sementes: ${sementes}`, 20, 60);

  textSize(19);
  text(mensagem, 20, 90);

  for (let planta of plantas) {
    planta.mostrar();
  }

  personagem.mostrar();
  personagem.mover();

  if (plantas.length > 0 && plantas.every((p) => p.estado === "florido")) {
    desenharInsetos();
  }

  for (let i = efeitosVisuais.length - 1; i >= 0; i--) {
    let efeito = efeitosVisuais[i];
    fill(139, 69, 19, efeito.alpha);
    ellipse(efeito.x, efeito.y, 20);
    efeito.y -= 1;
    efeito.alpha -= 5;
    if (efeito.alpha <= 0) {
      efeitosVisuais.splice(i, 1);
    }
  }

  if (mensagemCentral !== "") {
    fill(0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(mensagemCentral, width / 2, height / 2 - 100);
  }

  if (temporizadorAtivo) {
    fill(255, 0, 0);
    textSize(36);
    textAlign(CENTER, CENTER);
    text(`⏱️ ${ceil(tempoRestante / 60)}s`, width / 2, height / 2);
    tempoRestante--;

    if (tempoRestante <= 0) {
      temporizadorAtivo = false;
      for (let planta of plantas) {
        if (planta.estado === "germinado") {
          planta.estado = "murcha";
        }
      }
      mostrarMensagemCentral("Você não regou a tempo! As plantas murcharam 🥀");
    }
  }

  if (iniciarContagem && frameCount - tempoMensagem > 180) {
    tempoRestante = 600;
    temporizadorAtivo = true;
    iniciarContagem = false;
  }

  // Mensagens
  if (estadoMensagem === "inicio") {
    mensagem = "Pressione ESPAÇO para ganhar sementes";
  } else if (estadoMensagem === "comprouSementes") {
    if (!dentroArea(personagem.pos.x, 600, 720)) {
      mensagem = "Use R para plantar as sementes";
    } else {
      mensagem = "Pressione 'T' para comprar sementes por 1 moeda cada";
    }
  } else if (estadoMensagem === "plantando") {
    mensagem = "Use R para plantar as sementes";
  } else if (estadoMensagem === "precisaRegar") {
    mensagem = "Pressione 'A' para regar as plantas germinadas";
  } else {
    if (dentroArea(personagem.pos.x, 600, 720)) {
      mensagem = "Pressione 'T' para comprar sementes por 1 moeda cada";
    } else {
      mensagem = "";
    }
  }
}

function keyPressed() {
  if (keyCode === 32) {
    moedas += 1;
    estadoMensagem = "normal";
    mostrarMensagemCentral("Você carpintou e ganhou 1 moeda!");
    efeitosVisuais.push({
      x: personagem.pos.x,
      y: personagem.pos.y,
      alpha: 255,
    });

    // Marcar solo arado
    let indice = floor(personagem.pos.x / 20);
    if (!soloArado.includes(indice)) {
      soloArado.push(indice);
    }
  }

  if (key.toLowerCase() === "t" && dentroArea(personagem.pos.x, 600, 720)) {
    if (moedas >= 1) {
      moedas -= 1;
      sementes += 1;
      estadoMensagem = "comprouSementes";
      mostrarMensagemCentral("Você comprou 1 semente!");
    } else {
      mostrarMensagemCentral("Você não tem moedas suficientes!");
    }
  }

  if (key.toLowerCase() === "r" && sementes > 0) {
    let x = personagem.pos.x;
    plantas.push(new Planta(x, height - 140));
    sementes--;
    estadoMensagem = "plantando";

    mostrarMensagemCentral("Você plantou uma semente!");

    // Restaurar solo para grama
    let indice = floor(x / 20);
    soloArado = soloArado.filter((i) => i !== indice);

    if (sementes === 0 && !temporizadorAtivo) {
      mostrarMensagemCentral("Você plantou todas as sementes! Agora precisa regar!");
      iniciarContagem = true;
      tempoMensagem = frameCount;
      estadoMensagem = "precisaRegar";
    }
  }

  if (key.toLowerCase() === "a") {
    regarPlantaMaisProxima();
  }
}

function mostrarMensagemCentral(texto) {
  mensagemCentral = texto;
  setTimeout(() => (mensagemCentral = ""), 4000);
}

function regarPlantaMaisProxima() {
  let plantasParaRegar = plantas.filter((p) => p.estado === "germinado");

  if (plantasParaRegar.length === 0) {
    mostrarMensagemCentral("Não há plantas germinadas para regar.");
    return;
  }

  let plantaMaisProxima = plantasParaRegar[0];
  let distanciaMaisCurta = dist(personagem.pos.x, personagem.pos.y, plantaMaisProxima.pos.x, plantaMaisProxima.pos.y);

  for (let planta of plantasParaRegar) {
    let d = dist(personagem.pos.x, personagem.pos.y, planta.pos.x, planta.pos.y);
    if (d < distanciaMaisCurta) {
      distanciaMaisCurta = d;
      plantaMaisProxima = planta;
    }
  }

  if (distanciaMaisCurta < 50) {
    plantaMaisProxima.estado = "florido";
    efeitosVisuais.push({ x: plantaMaisProxima.pos.x, y: plantaMaisProxima.pos.y, alpha: 255 });
    mostrarMensagemCentral("Você regou uma planta! 🌹");

    if (plantas.filter((p) => p.estado === "germinado").length === 0) {
      temporizadorAtivo = false;
      estadoMensagem = "normal";
      mostrarMensagemCentral("Parabéns! Todas as plantas floresceram! 🌹");
    }
  } else {
    mostrarMensagemCentral("Chegue mais perto da planta para regar.");
  }
}

function dentroArea(x, min, max) {
  return x >= min && x <= max;
}

function desenharCasaDeSementes() {
  fill(255, 223, 186);
  rect(600, height - 220, 120, 70);
  fill(139, 69, 19);
  triangle(600, height - 250, 720, height - 250, 660, height - 290);
  fill(255);
  rect(600, height - 250, 120, 30);
  fill(0);
  textSize(13);
  textAlign(CENTER, CENTER);
  textFont("Arial");
  textStyle(BOLD);
  text("Casa de Sementes", 660, height - 235);
}

function desenharInsetos() {
  textSize(24);
  for (let inseto of insetos) {
    inseto.x += inseto.dirX * inseto.speed;
    inseto.y += inseto.dirY * inseto.speed;
    if (inseto.x < 300 || inseto.x > 500) inseto.dirX *= -1;
    if (inseto.y < height - 180 || inseto.y > height - 140) inseto.dirY *= -1;
    text(inseto.tipo, inseto.x, inseto.y);
  }
}

class Personagem {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
  }

  mover() {
    this.acc.set(0, 0);
    const acel = 0.2;
    const friccao = 0.15;

    if (keyIsDown(LEFT_ARROW)) this.acc.add(createVector(-acel, 0));
    if (keyIsDown(RIGHT_ARROW)) this.acc.add(createVector(acel, 0));
    if (keyIsDown(UP_ARROW)) this.acc.add(createVector(0, -acel));
    if (keyIsDown(DOWN_ARROW)) this.acc.add(createVector(0, acel));

    if (!keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
      this.vel.x *= 1 - friccao;
      if (abs(this.vel.x) < 0.01) this.vel.x = 0;
    }
    if (!keyIsDown(UP_ARROW) && !keyIsDown(DOWN_ARROW)) {
      this.vel.y *= 1 - friccao;
      if (abs(this.vel.y) < 0.01) this.vel.y = 0;
    }

    this.vel.add(this.acc);
    this.vel.limit(3);
    this.pos.add(this.vel);

    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height - 150);
  }

  mostrar() {
    textSize(42);
    textAlign(CENTER, CENTER);
    text("👨‍🌾", this.pos.x, this.pos.y);
  }
}

class Planta {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.estado = "germinado";
    this.tempo = 0;
  }

  mostrar() {
    textAlign(CENTER, CENTER);
    if (this.estado === "germinado") {
      textSize(24);
      text("🌱", this.pos.x, this.pos.y);
    } else if (this.estado === "florido") {
      textSize(32);
      text("🌹", this.pos.x, this.pos.y);
    } else if (this.estado === "murcha") {
      textSize(32);
      text("🥀", this.pos.x, this.pos.y);
    }
  }
}