document.documentElement.style.visibility = "hidden";

const STORAGE_KEY = "angels_painel_backup_local_v1";
const hoje = new Date().toISOString().slice(0, 10);

let db = null;
let usandoFirebase = false;

/* =========================================================
   INICIALIZAÇÃO DO FIREBASE
========================================================= */

function iniciarFirebase() {
  if (typeof firebase === "undefined") {
    throw new Error("O Firebase SDK não foi carregado.");
  }

  if (!window.firebaseConfig) {
    throw new Error("O arquivo firebase-config.js não foi carregado.");
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  return firebase.app();
}

/* =========================================================
   PROTEÇÃO DO PAINEL
========================================================= */

function protegerPainel() {
  return new Promise((resolve) => {
    try {
      iniciarFirebase();

      const auth = firebase.auth();

      auth.onAuthStateChanged((usuario) => {
        if (!usuario) {
          window.location.replace("login-admin.html");
          resolve(false);
          return;
        }

        document.documentElement.style.visibility = "visible";
        resolve(true);
      });
    } catch (erro) {
      console.error("Erro ao verificar o login:", erro);
      window.location.replace("login-admin.html");
      resolve(false);
    }
  });
}

async function sairDoPainel() {
  try {
    iniciarFirebase();
    await firebase.auth().signOut();
    window.location.replace("login-admin.html");
  } catch (erro) {
    console.error("Erro ao sair do painel:", erro);
    alert("Não foi possível encerrar a sessão.");
  }
}

/* =========================================================
   DADOS LOCAIS DE EMERGÊNCIA
========================================================= */

const dadosDemonstracao = [
  {
    id: "demo-1",
    tutor: "Juliana Lima",
    whatsapp: "21987654321",
    pet: "Luna",
    raca: "Shih Tzu",
    servico: "Banho e Tosa",
    porte: "Pequeno",
    data: hoje,
    hora: "09:00",
    busca: true,
    obs: "Prefere produtos hipoalergênicos.",
    status: "Pendente",
    origem: "Painel"
  },
  {
    id: "demo-2",
    tutor: "Carlos Eduardo",
    whatsapp: "21977778888",
    pet: "Thor",
    raca: "Golden Retriever",
    servico: "Banho",
    porte: "Grande",
    data: hoje,
    hora: "10:30",
    busca: false,
    obs: "",
    status: "Confirmado",
    origem: "Painel"
  }
];

function carregarLocal() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);

    if (salvo) {
      return JSON.parse(salvo);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(dadosDemonstracao)
    );

    return [...dadosDemonstracao];
  } catch (erro) {
    console.error("Erro ao carregar dados locais:", erro);
    return [...dadosDemonstracao];
  }
}

function salvarLocal(dados) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(dados)
    );
  } catch (erro) {
    console.error("Erro ao salvar dados locais:", erro);
  }
}

/* =========================================================
   SEGURANÇA E FORMATAÇÃO
========================================================= */

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarData(data) {
  if (!data) {
    return "";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "");
}

function montarLinkWhatsApp(agendamento) {
  const telefone = normalizarTelefone(
    agendamento.whatsapp
  );

  const mensagem =
    `Olá, ${agendamento.tutor}! ` +
    `Somos da Angels Estética Animal. ` +
    `O agendamento do pet ${agendamento.pet}, ` +
    `para o serviço ${agendamento.servico}, ` +
    `está com o status: ${agendamento.status}. ` +
    `Data: ${formatarData(agendamento.data)} ` +
    `às ${agendamento.hora}.`;

  return (
    `https://wa.me/55${telefone}` +
    `?text=${encodeURIComponent(mensagem)}`
  );
}

function classeDoStatus(status) {
  const classes = {
    Pendente: "Pendente",
    Confirmado: "Confirmado",
    Atendimento: "Atendimento",
    "Concluído": "Concluído",
    Cancelado: "Cancelado"
  };

  return classes[status] || "Pendente";
}

/* =========================================================
   STATUS DA CONEXÃO
========================================================= */

function definirStatusConexao(
  texto,
  classe = "notice"
) {
  const elemento = document.getElementById(
    "syncStatus"
  );

  if (!elemento) {
    return;
  }

  elemento.textContent = texto;

  if (elemento.parentElement) {
    elemento.parentElement.className =
      `sync-box ${classe}`;
  }
}

/* =========================================================
   CARTÕES DOS AGENDAMENTOS
========================================================= */

function criarCartao(agendamento) {
  const id = escaparHtml(agendamento.id);
  const tutor = escaparHtml(agendamento.tutor);
  const pet = escaparHtml(agendamento.pet);
  const raca = escaparHtml(
    agendamento.raca || "Raça não informada"
  );
  const servico = escaparHtml(
    agendamento.servico || "Serviço não informado"
  );
  const porte = escaparHtml(
    agendamento.porte || "Não informado"
  );
  const hora = escaparHtml(
    agendamento.hora || ""
  );
  const observacao = escaparHtml(
    agendamento.obs || ""
  );
  const origem = escaparHtml(
    agendamento.origem || "Cliente"
  );
  const status = escaparHtml(
    agendamento.status || "Pendente"
  );

  const linkWhatsApp =
    montarLinkWhatsApp(agendamento);

  return `
    <article class="booking">

      <div class="booking-top">

        <div>
          <h4>${pet} — ${servico}</h4>

          <p>
            <strong>Tutor:</strong> ${tutor}
          </p>

          <p>
            <strong>Raça:</strong> ${raca}
            •
            <strong>Porte:</strong> ${porte}
          </p>

          <p>
            <strong>Data:</strong>
            ${formatarData(agendamento.data)}
            às ${hora}
          </p>

          <p>
            ${
              agendamento.busca
                ? "🚗 Com busca e entrega"
                : "🏠 Sem busca e entrega"
            }
            • Origem: ${origem}
          </p>

          ${
            observacao
              ? `<p><strong>Observações:</strong> ${observacao}</p>`
              : ""
          }
        </div>

        <span class="badge ${classeDoStatus(status)}">
          ${status}
        </span>

      </div>

      <div class="booking-actions">

        <button
          class="ok"
          type="button"
          onclick="alterarStatus('${id}', 'Confirmado')">
          Confirmar
        </button>

        <button
          type="button"
          onclick="alterarStatus('${id}', 'Atendimento')">
          Atendimento
        </button>

        <button
          class="ok"
          type="button"
          onclick="alterarStatus('${id}', 'Concluído')">
          Finalizar
        </button>

        <button
          class="no"
          type="button"
          onclick="alterarStatus('${id}', 'Cancelado')">
          Cancelar
        </button>

        <button
          class="wa"
          type="button"
          onclick="window.open('${linkWhatsApp}', '_blank')">
          WhatsApp
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   EXIBIÇÃO DOS AGENDAMENTOS
========================================================= */

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function atualizarHtml(id, conteudo) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.innerHTML = conteudo;
  }
}

function ordenarAgendamentos(itens) {
  return [...itens].sort((a, b) => {
    const dataA =
      `${a.data || ""} ${a.hora || ""}`;

    const dataB =
      `${b.data || ""} ${b.hora || ""}`;

    return dataA.localeCompare(dataB);
  });
}

function renderizarAgendamentos(itens) {
  const ordenados = ordenarAgendamentos(itens);

  atualizarTexto(
    "countHoje",
    ordenados.filter(
      (item) => item.data === hoje
    ).length
  );

  atualizarTexto(
    "countPendentes",
    ordenados.filter(
      (item) => item.status === "Pendente"
    ).length
  );

  atualizarTexto(
    "countConfirmados",
    ordenados.filter(
      (item) => item.status === "Confirmado"
    ).length
  );

  atualizarTexto(
    "countClubinho",
    ordenados.filter(
      (item) => item.servico === "Clubinho"
    ).length
  );

  const vazio = `
    <div class="empty">
      Nenhum agendamento cadastrado.
    </div>
  `;

  atualizarHtml(
    "recentList",
    ordenados
      .slice(0, 3)
      .map(criarCartao)
      .join("") || vazio
  );

  atualizarHtml(
    "agendaList",
    ordenados
      .map(criarCartao)
      .join("") || vazio
  );
}

function renderizarLocal() {
  renderizarAgendamentos(carregarLocal());
}

/* =========================================================
   FIRESTORE
========================================================= */

async function conectarFirestore() {
  try {
    iniciarFirebase();

    if (!firebase.firestore) {
      throw new Error(
        "O Firestore SDK não foi carregado."
      );
    }

    db = firebase.firestore();
    usandoFirebase = true;

    definirStatusConexao(
      "Firebase online: painel sincronizado.",
      "success"
    );

    ouvirAgendamentos();

    return true;
  } catch (erro) {
    console.error(
      "Erro ao conectar ao Firestore:",
      erro
    );

    usandoFirebase = false;

    definirStatusConexao(
      "Não foi possível conectar ao Firebase. Modo local ativado.",
      "error"
    );

    return false;
  }
}

function ouvirAgendamentos() {
  if (!db) {
    return;
  }

  db.collection("agendamentos").onSnapshot(
    (snapshot) => {
      const itens = [];

      snapshot.forEach((documento) => {
        itens.push({
          id: documento.id,
          ...documento.data()
        });
      });

      renderizarAgendamentos(itens);
    },
    (erro) => {
      console.error(
        "Erro ao ler os agendamentos:",
        erro
      );

      definirStatusConexao(
        "Erro ao carregar os agendamentos. Verifique as regras do Firestore.",
        "error"
      );
    }
  );
}

/* =========================================================
   CADASTRAR AGENDAMENTO
========================================================= */

async function salvarAgendamento(item) {
  try {
    if (usandoFirebase && db) {
      const { id, ...dados } = item;

      await db.collection("agendamentos").add({
        ...dados,
        criadoEm:
          firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Agendamento salvo com sucesso.");
      return true;
    }

    const dadosLocais = carregarLocal();

    dadosLocais.push(item);
    salvarLocal(dadosLocais);
    renderizarLocal();

    alert(
      "Agendamento salvo apenas neste aparelho."
    );

    return true;
  } catch (erro) {
    console.error(
      "Erro ao salvar o agendamento:",
      erro
    );

    alert(
      "Não foi possível salvar o agendamento."
    );

    return false;
  }
}

/* =========================================================
   ALTERAR STATUS
========================================================= */

async function alterarStatus(id, status) {
  try {
    if (usandoFirebase && db) {
      await db
        .collection("agendamentos")
        .doc(id)
        .update({
          status,
          atualizadoEm:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      return;
    }

    const dadosLocais = carregarLocal();

    const indice = dadosLocais.findIndex(
      (item) => item.id === id
    );

    if (indice >= 0) {
      dadosLocais[indice].status = status;
      salvarLocal(dadosLocais);
      renderizarLocal();
    }
  } catch (erro) {
    console.error(
      "Erro ao alterar o status:",
      erro
    );

    alert(
      "Não foi possível alterar o status."
    );
  }
}

/* =========================================================
   NAVEGAÇÃO
========================================================= */

function mostrarTela(id) {
  document
    .querySelectorAll(".screen")
    .forEach((tela) => {
      tela.classList.remove("active");
    });

  const telaSelecionada =
    document.getElementById(id);

  if (telaSelecionada) {
    telaSelecionada.classList.add("active");
  }

  document
    .querySelectorAll(".bottom-nav button")
    .forEach((botao) => {
      botao.classList.toggle(
        "active",
        botao.dataset.screen === id
      );
    });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   FORMULÁRIO E EVENTOS
========================================================= */

function configurarFormulario() {
  const formulario =
    document.getElementById("bookingForm");

  if (!formulario) {
    return;
  }

  const campoData =
    formulario.querySelector(
      'input[name="data"]'
    );

  if (campoData && !campoData.value) {
    campoData.value = hoje;
  }

  formulario.addEventListener(
    "submit",
    async (evento) => {
      evento.preventDefault();

      const dados = Object.fromEntries(
        new FormData(formulario).entries()
      );

      const campoBusca =
        formulario.querySelector(
          'input[name="busca"]'
        );

      const salvo = await salvarAgendamento({
        id: String(Date.now()),
        tutor: String(dados.tutor || "").trim(),
        whatsapp: normalizarTelefone(
          dados.whatsapp
        ),
        pet: String(dados.pet || "").trim(),
        raca: String(dados.raca || "").trim(),
        servico: dados.servico,
        porte: dados.porte,
        data: dados.data,
        hora: dados.hora,
        busca: Boolean(
          campoBusca && campoBusca.checked
        ),
        obs: String(dados.obs || "").trim(),
        status: "Pendente",
        origem: "Painel"
      });

      if (salvo) {
        formulario.reset();

        if (campoData) {
          campoData.value = hoje;
        }

        mostrarTela("agenda");
      }
    }
  );
}

function configurarNavegacao() {
  document
    .querySelectorAll(".bottom-nav button")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        mostrarTela(botao.dataset.screen);
      });
    });
}

async function copyClientMessage() {
  const elemento =
    document.getElementById("clientMessage");

  if (!elemento) {
    return;
  }

  const texto = elemento.innerText.trim();

  try {
    await navigator.clipboard.writeText(texto);
    alert("Mensagem copiada.");
  } catch (erro) {
    console.error(
      "Erro ao copiar a mensagem:",
      erro
    );

    alert(texto);
  }
}

/* =========================================================
   INICIAR O PAINEL
========================================================= */

async function iniciarPainel() {
  configurarNavegacao();
  configurarFormulario();

  const conectado =
    await conectarFirestore();

  if (!conectado) {
    renderizarLocal();
  }
}

protegerPainel().then((autorizado) => {
  if (autorizado) {
    iniciarPainel();
  }
});
