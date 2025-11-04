let myChart = null; //variable para destruir el grafico y volver a renderizar
const URL_API = "https://mindicador.cl/api/";
const inputMonto = document.getElementById("clpInput");
const selectOption = document.getElementById("currencySelect");
const botonConvertir = document.getElementById("convertButton");

function crearFormateador(currency, locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatearConversion(montoCLP, datosMoneda, tipoMoneda) {
  const valorConvertido = montoCLP / datosMoneda.valor;

  let formateador;
  let locale = "es-CL";
  let currency = tipoMoneda === "dolar" ? "USD" : "EUR";

  if (tipoMoneda === "dolar") {
    locale = "en-US";
  } else if (tipoMoneda === "euro") {
    locale = "es-ES";
  }

  formateador = crearFormateador(currency, locale);
  return formateador.format(valorConvertido);
}

const mostrarResultadoDOM = (mensaje, esError = false) => {
  const mostrarResultado = document.getElementById("result");
  mostrarResultado.textContent = `Resultado: ${mensaje}`;
  mostrarResultado.style.color = esError ? "red" : "black";
};

async function obtenerDatos() {
  try {
    const res = await fetch(URL_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.log("error", error);
    mostrarResultadoDOM("Error al obtener datos de la API.", true);
    return null;
  }
}

async function convertir(valor, opcion) {
  const monto = parseFloat(valor.value);
  const option = opcion.value;
  const datos = await obtenerDatos();

  if (!datos || isNaN(monto) || monto <= 0) {
    mostrarResultadoDOM("Por favor, ingrese un monto válido.", true);
    return;
  }

  const datosMoneda = datos[option];

  const resultadoFormateado = formatearConversion(monto, datosMoneda, option);
  renderGrafica(option);
  mostrarResultadoDOM(resultadoFormateado);
}

async function obtenerDatosGraficoMoneda(monedaAGraficar) {
  const resultGrafico = document.getElementById("resultGrafico");
  try {
    const res = await fetch(`${URL_API}${monedaAGraficar}`);
    const moneda = await res.json();
    const serie = moneda.serie;
    const nombre = moneda.nombre;
    const labels = serie.map((item) => item.fecha.substring(0, 10)).reverse();
    const data = serie.map((item) => item.valor).reverse();
    return { labels, data, nombre };
  } catch (err) {
    resultGrafico.textContent = `Error al obtener datos para el gráfico`;
    resultGrafico.style.color = "red";
    resultGrafico.style.marginTop = "25px";
    return { labels: [], data: [], nombre: "" };
  }
}

function prepararConfiguracionGrafico(labels, data, nombreMoneda) {
  const config = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Valor del ${nombreMoneda} (CLP)`,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          data: data,
          borderWidth: 2,
        },
      ],
    },
  };
  return config;
}

async function renderGrafica(monedaAGraficar) {
  const { labels, data, nombre } = await obtenerDatosGraficoMoneda(
    monedaAGraficar
  );

  if (labels.length === 0 || data.length === 0) {
    console.log("No hay datos para renderizar la gráfica.");
    if (myChart) {
      myChart.destroy();
      myChart = null;
    }
    return;
  }

  const nombreMoneda = nombre;
  const config = prepararConfiguracionGrafico(labels, data, nombreMoneda);
  const chartDOM = document.getElementById("myChart");
  if (myChart) {
    myChart.destroy();
  }
  myChart = new Chart(chartDOM, config);
}

botonConvertir.addEventListener("click", () => {
  convertir(inputMonto, selectOption);
});
