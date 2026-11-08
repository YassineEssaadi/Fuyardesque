import { CityMap, Connection, Station, TransportType } from './types';

export const STATIONS: Station[] = [
  {
    "id": "st-01",
    "name": "Place des Lanternes",
    "district": "Centre ancien",
    "x": 600,
    "y": 420
  },
  {
    "id": "st-02",
    "name": "Rue des Arcades",
    "district": "Centre ancien",
    "x": 540,
    "y": 360
  },
  {
    "id": "st-03",
    "name": "Parvis des Arts",
    "district": "Centre ancien",
    "x": 670,
    "y": 360
  },
  {
    "id": "st-04",
    "name": "Marché des Tanneurs",
    "district": "Centre ancien",
    "x": 510,
    "y": 450
  },
  {
    "id": "st-05",
    "name": "Place du Théâtre",
    "district": "Centre ancien",
    "x": 690,
    "y": 450
  },
  {
    "id": "st-06",
    "name": "Passage des Ormes",
    "district": "Centre ancien",
    "x": 580,
    "y": 490
  },
  {
    "id": "st-07",
    "name": "Palais des Archives",
    "district": "Centre ancien",
    "x": 630,
    "y": 510
  },
  {
    "id": "st-08",
    "name": "Porte de l'Horloge",
    "district": "Centre ancien",
    "x": 450,
    "y": 390
  },
  {
    "id": "st-09",
    "name": "Quai des Brumes",
    "district": "Centre ancien",
    "x": 750,
    "y": 410
  },
  {
    "id": "st-10",
    "name": "Tour des Verrières",
    "district": "Quartier des affaires",
    "x": 860,
    "y": 270
  },
  {
    "id": "st-11",
    "name": "Bourse des Ateliers",
    "district": "Quartier des affaires",
    "x": 780,
    "y": 220
  },
  {
    "id": "st-12",
    "name": "Passage des Étoiles",
    "district": "Quartier des affaires",
    "x": 940,
    "y": 230
  },
  {
    "id": "st-13",
    "name": "Place du Belvédère",
    "district": "Quartier des affaires",
    "x": 880,
    "y": 350
  },
  {
    "id": "st-14",
    "name": "Quai des Saules",
    "district": "Quartier des affaires",
    "x": 990,
    "y": 330
  },
  {
    "id": "st-15",
    "name": "Carrefour des Banquiers",
    "district": "Quartier des affaires",
    "x": 770,
    "y": 310
  },
  {
    "id": "st-16",
    "name": "Tour du Nord",
    "district": "Quartier des affaires",
    "x": 850,
    "y": 150
  },
  {
    "id": "st-17",
    "name": "Porte des Peupliers",
    "district": "Quartier des affaires",
    "x": 960,
    "y": 140
  },
  {
    "id": "st-18",
    "name": "Musée des Rives",
    "district": "Rives de l'Est",
    "x": 810,
    "y": 500
  },
  {
    "id": "st-19",
    "name": "Quai du Levant",
    "district": "Rives de l'Est",
    "x": 900,
    "y": 480
  },
  {
    "id": "st-20",
    "name": "Marché aux Poissons",
    "district": "Rives de l'Est",
    "x": 870,
    "y": 580
  },
  {
    "id": "st-21",
    "name": "Écluse des Cygnes",
    "district": "Rives de l'Est",
    "x": 760,
    "y": 610
  },
  {
    "id": "st-22",
    "name": "Promenade des Voiliers",
    "district": "Rives de l'Est",
    "x": 970,
    "y": 560
  },
  {
    "id": "st-23",
    "name": "Pointe du Phare",
    "district": "Rives de l'Est",
    "x": 1050,
    "y": 620
  },
  {
    "id": "st-24",
    "name": "Bassin des Mariniers",
    "district": "Rives de l'Est",
    "x": 920,
    "y": 680
  },
  {
    "id": "st-25",
    "name": "Quai du Midi",
    "district": "Rives de l'Est",
    "x": 820,
    "y": 710
  },
  {
    "id": "st-26",
    "name": "Campus des Sciences",
    "district": "Jardins du Nord",
    "x": 430,
    "y": 180
  },
  {
    "id": "st-27",
    "name": "Jardin des Verrières",
    "district": "Jardins du Nord",
    "x": 530,
    "y": 150
  },
  {
    "id": "st-28",
    "name": "Galerie des Beaux-Arts",
    "district": "Jardins du Nord",
    "x": 630,
    "y": 190
  },
  {
    "id": "st-29",
    "name": "Lac des Saules",
    "district": "Jardins du Nord",
    "x": 510,
    "y": 250
  },
  {
    "id": "st-30",
    "name": "Roseraie des Brumes",
    "district": "Jardins du Nord",
    "x": 380,
    "y": 270
  },
  {
    "id": "st-31",
    "name": "Terrasse du Belvédère",
    "district": "Jardins du Nord",
    "x": 620,
    "y": 100
  },
  {
    "id": "st-32",
    "name": "Porte du Bois",
    "district": "Jardins du Nord",
    "x": 340,
    "y": 160
  },
  {
    "id": "st-33",
    "name": "Observatoire des Collines",
    "district": "Jardins du Nord",
    "x": 460,
    "y": 80
  },
  {
    "id": "st-34",
    "name": "Dépôt des Tramways",
    "district": "Faubourg des ateliers",
    "x": 540,
    "y": 610
  },
  {
    "id": "st-35",
    "name": "Carrefour des Rails",
    "district": "Faubourg des ateliers",
    "x": 430,
    "y": 620
  },
  {
    "id": "st-36",
    "name": "Centrale des Rives",
    "district": "Faubourg des ateliers",
    "x": 640,
    "y": 660
  },
  {
    "id": "st-37",
    "name": "Forges du Faubourg",
    "district": "Faubourg des ateliers",
    "x": 480,
    "y": 710
  },
  {
    "id": "st-38",
    "name": "Halle des Marchandises",
    "district": "Faubourg des ateliers",
    "x": 580,
    "y": 730
  },
  {
    "id": "st-39",
    "name": "Ateliers des Teinturiers",
    "district": "Faubourg des ateliers",
    "x": 360,
    "y": 710
  },
  {
    "id": "st-40",
    "name": "Terminal des Quais",
    "district": "Faubourg des ateliers",
    "x": 700,
    "y": 740
  },
  {
    "id": "st-41",
    "name": "Rocade des Faubourgs",
    "district": "Faubourg des ateliers",
    "x": 330,
    "y": 590
  },
  {
    "id": "st-42",
    "name": "Grande Rue",
    "district": "Collines de l'Ouest",
    "x": 340,
    "y": 380
  },
  {
    "id": "st-43",
    "name": "Terrasse du Couchant",
    "district": "Collines de l'Ouest",
    "x": 230,
    "y": 340
  },
  {
    "id": "st-44",
    "name": "Butte des Pins",
    "district": "Collines de l'Ouest",
    "x": 210,
    "y": 440
  },
  {
    "id": "st-45",
    "name": "Villas du Parc",
    "district": "Collines de l'Ouest",
    "x": 130,
    "y": 360
  },
  {
    "id": "st-46",
    "name": "Église de la Butte",
    "district": "Collines de l'Ouest",
    "x": 260,
    "y": 240
  },
  {
    "id": "st-47",
    "name": "Belvédère de l'Ouest",
    "district": "Collines de l'Ouest",
    "x": 160,
    "y": 230
  },
  {
    "id": "st-48",
    "name": "Vallon des Jardins",
    "district": "Collines de l'Ouest",
    "x": 310,
    "y": 480
  },
  {
    "id": "st-49",
    "name": "Viaduc des Brumes",
    "district": "Collines de l'Ouest",
    "x": 210,
    "y": 540
  },
  {
    "id": "st-50",
    "name": "Moulin des Hauteurs",
    "district": "Collines de l'Ouest",
    "x": 110,
    "y": 480
  }
];

export const CONNECTIONS: Connection[] = [
  {
    "from": "st-01",
    "to": "st-02",
    "transport": "taxi"
  },
  {
    "from": "st-02",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-04",
    "transport": "taxi"
  },
  {
    "from": "st-04",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-05",
    "transport": "taxi"
  },
  {
    "from": "st-05",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-06",
    "transport": "taxi"
  },
  {
    "from": "st-06",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-07",
    "transport": "taxi"
  },
  {
    "from": "st-07",
    "to": "st-01",
    "transport": "taxi"
  },
  {
    "from": "st-02",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-02",
    "transport": "taxi"
  },
  {
    "from": "st-02",
    "to": "st-04",
    "transport": "taxi"
  },
  {
    "from": "st-04",
    "to": "st-02",
    "transport": "taxi"
  },
  {
    "from": "st-02",
    "to": "st-08",
    "transport": "taxi"
  },
  {
    "from": "st-08",
    "to": "st-02",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-05",
    "transport": "taxi"
  },
  {
    "from": "st-05",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-09",
    "transport": "taxi"
  },
  {
    "from": "st-09",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-04",
    "to": "st-06",
    "transport": "taxi"
  },
  {
    "from": "st-06",
    "to": "st-04",
    "transport": "taxi"
  },
  {
    "from": "st-04",
    "to": "st-08",
    "transport": "taxi"
  },
  {
    "from": "st-08",
    "to": "st-04",
    "transport": "taxi"
  },
  {
    "from": "st-05",
    "to": "st-07",
    "transport": "taxi"
  },
  {
    "from": "st-07",
    "to": "st-05",
    "transport": "taxi"
  },
  {
    "from": "st-05",
    "to": "st-09",
    "transport": "taxi"
  },
  {
    "from": "st-09",
    "to": "st-05",
    "transport": "taxi"
  },
  {
    "from": "st-06",
    "to": "st-07",
    "transport": "taxi"
  },
  {
    "from": "st-07",
    "to": "st-06",
    "transport": "taxi"
  },
  {
    "from": "st-08",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-08",
    "transport": "taxi"
  },
  {
    "from": "st-09",
    "to": "st-15",
    "transport": "taxi"
  },
  {
    "from": "st-15",
    "to": "st-09",
    "transport": "taxi"
  },
  {
    "from": "st-09",
    "to": "st-18",
    "transport": "taxi"
  },
  {
    "from": "st-18",
    "to": "st-09",
    "transport": "taxi"
  },
  {
    "from": "st-10",
    "to": "st-11",
    "transport": "taxi"
  },
  {
    "from": "st-11",
    "to": "st-10",
    "transport": "taxi"
  },
  {
    "from": "st-10",
    "to": "st-12",
    "transport": "taxi"
  },
  {
    "from": "st-12",
    "to": "st-10",
    "transport": "taxi"
  },
  {
    "from": "st-10",
    "to": "st-13",
    "transport": "taxi"
  },
  {
    "from": "st-13",
    "to": "st-10",
    "transport": "taxi"
  },
  {
    "from": "st-10",
    "to": "st-15",
    "transport": "taxi"
  },
  {
    "from": "st-15",
    "to": "st-10",
    "transport": "taxi"
  },
  {
    "from": "st-11",
    "to": "st-15",
    "transport": "taxi"
  },
  {
    "from": "st-15",
    "to": "st-11",
    "transport": "taxi"
  },
  {
    "from": "st-11",
    "to": "st-16",
    "transport": "taxi"
  },
  {
    "from": "st-16",
    "to": "st-11",
    "transport": "taxi"
  },
  {
    "from": "st-11",
    "to": "st-28",
    "transport": "taxi"
  },
  {
    "from": "st-28",
    "to": "st-11",
    "transport": "taxi"
  },
  {
    "from": "st-12",
    "to": "st-13",
    "transport": "taxi"
  },
  {
    "from": "st-13",
    "to": "st-12",
    "transport": "taxi"
  },
  {
    "from": "st-12",
    "to": "st-14",
    "transport": "taxi"
  },
  {
    "from": "st-14",
    "to": "st-12",
    "transport": "taxi"
  },
  {
    "from": "st-12",
    "to": "st-16",
    "transport": "taxi"
  },
  {
    "from": "st-16",
    "to": "st-12",
    "transport": "taxi"
  },
  {
    "from": "st-12",
    "to": "st-17",
    "transport": "taxi"
  },
  {
    "from": "st-17",
    "to": "st-12",
    "transport": "taxi"
  },
  {
    "from": "st-13",
    "to": "st-14",
    "transport": "taxi"
  },
  {
    "from": "st-14",
    "to": "st-13",
    "transport": "taxi"
  },
  {
    "from": "st-13",
    "to": "st-15",
    "transport": "taxi"
  },
  {
    "from": "st-15",
    "to": "st-13",
    "transport": "taxi"
  },
  {
    "from": "st-13",
    "to": "st-19",
    "transport": "taxi"
  },
  {
    "from": "st-19",
    "to": "st-13",
    "transport": "taxi"
  },
  {
    "from": "st-14",
    "to": "st-17",
    "transport": "taxi"
  },
  {
    "from": "st-17",
    "to": "st-14",
    "transport": "taxi"
  },
  {
    "from": "st-14",
    "to": "st-19",
    "transport": "taxi"
  },
  {
    "from": "st-19",
    "to": "st-14",
    "transport": "taxi"
  },
  {
    "from": "st-15",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-15",
    "transport": "taxi"
  },
  {
    "from": "st-16",
    "to": "st-17",
    "transport": "taxi"
  },
  {
    "from": "st-17",
    "to": "st-16",
    "transport": "taxi"
  },
  {
    "from": "st-18",
    "to": "st-19",
    "transport": "taxi"
  },
  {
    "from": "st-19",
    "to": "st-18",
    "transport": "taxi"
  },
  {
    "from": "st-18",
    "to": "st-20",
    "transport": "taxi"
  },
  {
    "from": "st-20",
    "to": "st-18",
    "transport": "taxi"
  },
  {
    "from": "st-18",
    "to": "st-21",
    "transport": "taxi"
  },
  {
    "from": "st-21",
    "to": "st-18",
    "transport": "taxi"
  },
  {
    "from": "st-18",
    "to": "st-07",
    "transport": "taxi"
  },
  {
    "from": "st-07",
    "to": "st-18",
    "transport": "taxi"
  },
  {
    "from": "st-19",
    "to": "st-20",
    "transport": "taxi"
  },
  {
    "from": "st-20",
    "to": "st-19",
    "transport": "taxi"
  },
  {
    "from": "st-19",
    "to": "st-22",
    "transport": "taxi"
  },
  {
    "from": "st-22",
    "to": "st-19",
    "transport": "taxi"
  },
  {
    "from": "st-20",
    "to": "st-21",
    "transport": "taxi"
  },
  {
    "from": "st-21",
    "to": "st-20",
    "transport": "taxi"
  },
  {
    "from": "st-20",
    "to": "st-22",
    "transport": "taxi"
  },
  {
    "from": "st-22",
    "to": "st-20",
    "transport": "taxi"
  },
  {
    "from": "st-20",
    "to": "st-24",
    "transport": "taxi"
  },
  {
    "from": "st-24",
    "to": "st-20",
    "transport": "taxi"
  },
  {
    "from": "st-21",
    "to": "st-25",
    "transport": "taxi"
  },
  {
    "from": "st-25",
    "to": "st-21",
    "transport": "taxi"
  },
  {
    "from": "st-21",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-21",
    "transport": "taxi"
  },
  {
    "from": "st-22",
    "to": "st-23",
    "transport": "taxi"
  },
  {
    "from": "st-23",
    "to": "st-22",
    "transport": "taxi"
  },
  {
    "from": "st-22",
    "to": "st-24",
    "transport": "taxi"
  },
  {
    "from": "st-24",
    "to": "st-22",
    "transport": "taxi"
  },
  {
    "from": "st-23",
    "to": "st-24",
    "transport": "taxi"
  },
  {
    "from": "st-24",
    "to": "st-23",
    "transport": "taxi"
  },
  {
    "from": "st-24",
    "to": "st-25",
    "transport": "taxi"
  },
  {
    "from": "st-25",
    "to": "st-24",
    "transport": "taxi"
  },
  {
    "from": "st-25",
    "to": "st-36",
    "transport": "taxi"
  },
  {
    "from": "st-36",
    "to": "st-25",
    "transport": "taxi"
  },
  {
    "from": "st-25",
    "to": "st-40",
    "transport": "taxi"
  },
  {
    "from": "st-40",
    "to": "st-25",
    "transport": "taxi"
  },
  {
    "from": "st-26",
    "to": "st-27",
    "transport": "taxi"
  },
  {
    "from": "st-27",
    "to": "st-26",
    "transport": "taxi"
  },
  {
    "from": "st-26",
    "to": "st-29",
    "transport": "taxi"
  },
  {
    "from": "st-29",
    "to": "st-26",
    "transport": "taxi"
  },
  {
    "from": "st-26",
    "to": "st-30",
    "transport": "taxi"
  },
  {
    "from": "st-30",
    "to": "st-26",
    "transport": "taxi"
  },
  {
    "from": "st-26",
    "to": "st-32",
    "transport": "taxi"
  },
  {
    "from": "st-32",
    "to": "st-26",
    "transport": "taxi"
  },
  {
    "from": "st-26",
    "to": "st-33",
    "transport": "taxi"
  },
  {
    "from": "st-33",
    "to": "st-26",
    "transport": "taxi"
  },
  {
    "from": "st-27",
    "to": "st-28",
    "transport": "taxi"
  },
  {
    "from": "st-28",
    "to": "st-27",
    "transport": "taxi"
  },
  {
    "from": "st-27",
    "to": "st-29",
    "transport": "taxi"
  },
  {
    "from": "st-29",
    "to": "st-27",
    "transport": "taxi"
  },
  {
    "from": "st-27",
    "to": "st-31",
    "transport": "taxi"
  },
  {
    "from": "st-31",
    "to": "st-27",
    "transport": "taxi"
  },
  {
    "from": "st-27",
    "to": "st-33",
    "transport": "taxi"
  },
  {
    "from": "st-33",
    "to": "st-27",
    "transport": "taxi"
  },
  {
    "from": "st-28",
    "to": "st-29",
    "transport": "taxi"
  },
  {
    "from": "st-29",
    "to": "st-28",
    "transport": "taxi"
  },
  {
    "from": "st-28",
    "to": "st-31",
    "transport": "taxi"
  },
  {
    "from": "st-31",
    "to": "st-28",
    "transport": "taxi"
  },
  {
    "from": "st-28",
    "to": "st-03",
    "transport": "taxi"
  },
  {
    "from": "st-03",
    "to": "st-28",
    "transport": "taxi"
  },
  {
    "from": "st-29",
    "to": "st-30",
    "transport": "taxi"
  },
  {
    "from": "st-30",
    "to": "st-29",
    "transport": "taxi"
  },
  {
    "from": "st-29",
    "to": "st-02",
    "transport": "taxi"
  },
  {
    "from": "st-02",
    "to": "st-29",
    "transport": "taxi"
  },
  {
    "from": "st-30",
    "to": "st-32",
    "transport": "taxi"
  },
  {
    "from": "st-32",
    "to": "st-30",
    "transport": "taxi"
  },
  {
    "from": "st-30",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-30",
    "transport": "taxi"
  },
  {
    "from": "st-30",
    "to": "st-46",
    "transport": "taxi"
  },
  {
    "from": "st-46",
    "to": "st-30",
    "transport": "taxi"
  },
  {
    "from": "st-31",
    "to": "st-33",
    "transport": "taxi"
  },
  {
    "from": "st-33",
    "to": "st-31",
    "transport": "taxi"
  },
  {
    "from": "st-32",
    "to": "st-33",
    "transport": "taxi"
  },
  {
    "from": "st-33",
    "to": "st-32",
    "transport": "taxi"
  },
  {
    "from": "st-32",
    "to": "st-46",
    "transport": "taxi"
  },
  {
    "from": "st-46",
    "to": "st-32",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-35",
    "transport": "taxi"
  },
  {
    "from": "st-35",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-36",
    "transport": "taxi"
  },
  {
    "from": "st-36",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-37",
    "transport": "taxi"
  },
  {
    "from": "st-37",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-38",
    "transport": "taxi"
  },
  {
    "from": "st-38",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-34",
    "to": "st-06",
    "transport": "taxi"
  },
  {
    "from": "st-06",
    "to": "st-34",
    "transport": "taxi"
  },
  {
    "from": "st-35",
    "to": "st-37",
    "transport": "taxi"
  },
  {
    "from": "st-37",
    "to": "st-35",
    "transport": "taxi"
  },
  {
    "from": "st-35",
    "to": "st-39",
    "transport": "taxi"
  },
  {
    "from": "st-39",
    "to": "st-35",
    "transport": "taxi"
  },
  {
    "from": "st-35",
    "to": "st-41",
    "transport": "taxi"
  },
  {
    "from": "st-41",
    "to": "st-35",
    "transport": "taxi"
  },
  {
    "from": "st-35",
    "to": "st-48",
    "transport": "taxi"
  },
  {
    "from": "st-48",
    "to": "st-35",
    "transport": "taxi"
  },
  {
    "from": "st-36",
    "to": "st-38",
    "transport": "taxi"
  },
  {
    "from": "st-38",
    "to": "st-36",
    "transport": "taxi"
  },
  {
    "from": "st-36",
    "to": "st-40",
    "transport": "taxi"
  },
  {
    "from": "st-40",
    "to": "st-36",
    "transport": "taxi"
  },
  {
    "from": "st-36",
    "to": "st-07",
    "transport": "taxi"
  },
  {
    "from": "st-07",
    "to": "st-36",
    "transport": "taxi"
  },
  {
    "from": "st-37",
    "to": "st-38",
    "transport": "taxi"
  },
  {
    "from": "st-38",
    "to": "st-37",
    "transport": "taxi"
  },
  {
    "from": "st-37",
    "to": "st-39",
    "transport": "taxi"
  },
  {
    "from": "st-39",
    "to": "st-37",
    "transport": "taxi"
  },
  {
    "from": "st-38",
    "to": "st-40",
    "transport": "taxi"
  },
  {
    "from": "st-40",
    "to": "st-38",
    "transport": "taxi"
  },
  {
    "from": "st-39",
    "to": "st-41",
    "transport": "taxi"
  },
  {
    "from": "st-41",
    "to": "st-39",
    "transport": "taxi"
  },
  {
    "from": "st-40",
    "to": "st-25",
    "transport": "taxi"
  },
  {
    "from": "st-25",
    "to": "st-40",
    "transport": "taxi"
  },
  {
    "from": "st-41",
    "to": "st-48",
    "transport": "taxi"
  },
  {
    "from": "st-48",
    "to": "st-41",
    "transport": "taxi"
  },
  {
    "from": "st-41",
    "to": "st-49",
    "transport": "taxi"
  },
  {
    "from": "st-49",
    "to": "st-41",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-43",
    "transport": "taxi"
  },
  {
    "from": "st-43",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-46",
    "transport": "taxi"
  },
  {
    "from": "st-46",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-42",
    "to": "st-48",
    "transport": "taxi"
  },
  {
    "from": "st-48",
    "to": "st-42",
    "transport": "taxi"
  },
  {
    "from": "st-43",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-43",
    "transport": "taxi"
  },
  {
    "from": "st-43",
    "to": "st-45",
    "transport": "taxi"
  },
  {
    "from": "st-45",
    "to": "st-43",
    "transport": "taxi"
  },
  {
    "from": "st-43",
    "to": "st-46",
    "transport": "taxi"
  },
  {
    "from": "st-46",
    "to": "st-43",
    "transport": "taxi"
  },
  {
    "from": "st-43",
    "to": "st-47",
    "transport": "taxi"
  },
  {
    "from": "st-47",
    "to": "st-43",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-45",
    "transport": "taxi"
  },
  {
    "from": "st-45",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-48",
    "transport": "taxi"
  },
  {
    "from": "st-48",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-49",
    "transport": "taxi"
  },
  {
    "from": "st-49",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-44",
    "to": "st-50",
    "transport": "taxi"
  },
  {
    "from": "st-50",
    "to": "st-44",
    "transport": "taxi"
  },
  {
    "from": "st-45",
    "to": "st-47",
    "transport": "taxi"
  },
  {
    "from": "st-47",
    "to": "st-45",
    "transport": "taxi"
  },
  {
    "from": "st-45",
    "to": "st-50",
    "transport": "taxi"
  },
  {
    "from": "st-50",
    "to": "st-45",
    "transport": "taxi"
  },
  {
    "from": "st-46",
    "to": "st-47",
    "transport": "taxi"
  },
  {
    "from": "st-47",
    "to": "st-46",
    "transport": "taxi"
  },
  {
    "from": "st-48",
    "to": "st-49",
    "transport": "taxi"
  },
  {
    "from": "st-49",
    "to": "st-48",
    "transport": "taxi"
  },
  {
    "from": "st-49",
    "to": "st-50",
    "transport": "taxi"
  },
  {
    "from": "st-50",
    "to": "st-49",
    "transport": "taxi"
  },
  {
    "from": "st-01",
    "to": "st-10",
    "transport": "bus"
  },
  {
    "from": "st-10",
    "to": "st-01",
    "transport": "bus"
  },
  {
    "from": "st-01",
    "to": "st-29",
    "transport": "bus"
  },
  {
    "from": "st-29",
    "to": "st-01",
    "transport": "bus"
  },
  {
    "from": "st-01",
    "to": "st-34",
    "transport": "bus"
  },
  {
    "from": "st-34",
    "to": "st-01",
    "transport": "bus"
  },
  {
    "from": "st-01",
    "to": "st-42",
    "transport": "bus"
  },
  {
    "from": "st-42",
    "to": "st-01",
    "transport": "bus"
  },
  {
    "from": "st-02",
    "to": "st-26",
    "transport": "bus"
  },
  {
    "from": "st-26",
    "to": "st-02",
    "transport": "bus"
  },
  {
    "from": "st-02",
    "to": "st-46",
    "transport": "bus"
  },
  {
    "from": "st-46",
    "to": "st-02",
    "transport": "bus"
  },
  {
    "from": "st-03",
    "to": "st-11",
    "transport": "bus"
  },
  {
    "from": "st-11",
    "to": "st-03",
    "transport": "bus"
  },
  {
    "from": "st-03",
    "to": "st-28",
    "transport": "bus"
  },
  {
    "from": "st-28",
    "to": "st-03",
    "transport": "bus"
  },
  {
    "from": "st-04",
    "to": "st-42",
    "transport": "bus"
  },
  {
    "from": "st-42",
    "to": "st-04",
    "transport": "bus"
  },
  {
    "from": "st-04",
    "to": "st-48",
    "transport": "bus"
  },
  {
    "from": "st-48",
    "to": "st-04",
    "transport": "bus"
  },
  {
    "from": "st-05",
    "to": "st-15",
    "transport": "bus"
  },
  {
    "from": "st-15",
    "to": "st-05",
    "transport": "bus"
  },
  {
    "from": "st-05",
    "to": "st-18",
    "transport": "bus"
  },
  {
    "from": "st-18",
    "to": "st-05",
    "transport": "bus"
  },
  {
    "from": "st-06",
    "to": "st-21",
    "transport": "bus"
  },
  {
    "from": "st-21",
    "to": "st-06",
    "transport": "bus"
  },
  {
    "from": "st-06",
    "to": "st-35",
    "transport": "bus"
  },
  {
    "from": "st-35",
    "to": "st-06",
    "transport": "bus"
  },
  {
    "from": "st-07",
    "to": "st-36",
    "transport": "bus"
  },
  {
    "from": "st-36",
    "to": "st-07",
    "transport": "bus"
  },
  {
    "from": "st-07",
    "to": "st-20",
    "transport": "bus"
  },
  {
    "from": "st-20",
    "to": "st-07",
    "transport": "bus"
  },
  {
    "from": "st-08",
    "to": "st-43",
    "transport": "bus"
  },
  {
    "from": "st-43",
    "to": "st-08",
    "transport": "bus"
  },
  {
    "from": "st-08",
    "to": "st-26",
    "transport": "bus"
  },
  {
    "from": "st-26",
    "to": "st-08",
    "transport": "bus"
  },
  {
    "from": "st-09",
    "to": "st-13",
    "transport": "bus"
  },
  {
    "from": "st-13",
    "to": "st-09",
    "transport": "bus"
  },
  {
    "from": "st-09",
    "to": "st-19",
    "transport": "bus"
  },
  {
    "from": "st-19",
    "to": "st-09",
    "transport": "bus"
  },
  {
    "from": "st-11",
    "to": "st-16",
    "transport": "bus"
  },
  {
    "from": "st-16",
    "to": "st-11",
    "transport": "bus"
  },
  {
    "from": "st-11",
    "to": "st-27",
    "transport": "bus"
  },
  {
    "from": "st-27",
    "to": "st-11",
    "transport": "bus"
  },
  {
    "from": "st-12",
    "to": "st-14",
    "transport": "bus"
  },
  {
    "from": "st-14",
    "to": "st-12",
    "transport": "bus"
  },
  {
    "from": "st-12",
    "to": "st-17",
    "transport": "bus"
  },
  {
    "from": "st-17",
    "to": "st-12",
    "transport": "bus"
  },
  {
    "from": "st-13",
    "to": "st-22",
    "transport": "bus"
  },
  {
    "from": "st-22",
    "to": "st-13",
    "transport": "bus"
  },
  {
    "from": "st-13",
    "to": "st-18",
    "transport": "bus"
  },
  {
    "from": "st-18",
    "to": "st-13",
    "transport": "bus"
  },
  {
    "from": "st-16",
    "to": "st-31",
    "transport": "bus"
  },
  {
    "from": "st-31",
    "to": "st-16",
    "transport": "bus"
  },
  {
    "from": "st-18",
    "to": "st-24",
    "transport": "bus"
  },
  {
    "from": "st-24",
    "to": "st-18",
    "transport": "bus"
  },
  {
    "from": "st-18",
    "to": "st-36",
    "transport": "bus"
  },
  {
    "from": "st-36",
    "to": "st-18",
    "transport": "bus"
  },
  {
    "from": "st-19",
    "to": "st-23",
    "transport": "bus"
  },
  {
    "from": "st-23",
    "to": "st-19",
    "transport": "bus"
  },
  {
    "from": "st-20",
    "to": "st-25",
    "transport": "bus"
  },
  {
    "from": "st-25",
    "to": "st-20",
    "transport": "bus"
  },
  {
    "from": "st-21",
    "to": "st-38",
    "transport": "bus"
  },
  {
    "from": "st-38",
    "to": "st-21",
    "transport": "bus"
  },
  {
    "from": "st-24",
    "to": "st-40",
    "transport": "bus"
  },
  {
    "from": "st-40",
    "to": "st-24",
    "transport": "bus"
  },
  {
    "from": "st-26",
    "to": "st-31",
    "transport": "bus"
  },
  {
    "from": "st-31",
    "to": "st-26",
    "transport": "bus"
  },
  {
    "from": "st-26",
    "to": "st-46",
    "transport": "bus"
  },
  {
    "from": "st-46",
    "to": "st-26",
    "transport": "bus"
  },
  {
    "from": "st-27",
    "to": "st-30",
    "transport": "bus"
  },
  {
    "from": "st-30",
    "to": "st-27",
    "transport": "bus"
  },
  {
    "from": "st-28",
    "to": "st-10",
    "transport": "bus"
  },
  {
    "from": "st-10",
    "to": "st-28",
    "transport": "bus"
  },
  {
    "from": "st-29",
    "to": "st-32",
    "transport": "bus"
  },
  {
    "from": "st-32",
    "to": "st-29",
    "transport": "bus"
  },
  {
    "from": "st-29",
    "to": "st-08",
    "transport": "bus"
  },
  {
    "from": "st-08",
    "to": "st-29",
    "transport": "bus"
  },
  {
    "from": "st-30",
    "to": "st-47",
    "transport": "bus"
  },
  {
    "from": "st-47",
    "to": "st-30",
    "transport": "bus"
  },
  {
    "from": "st-33",
    "to": "st-28",
    "transport": "bus"
  },
  {
    "from": "st-28",
    "to": "st-33",
    "transport": "bus"
  },
  {
    "from": "st-33",
    "to": "st-31",
    "transport": "bus"
  },
  {
    "from": "st-31",
    "to": "st-33",
    "transport": "bus"
  },
  {
    "from": "st-34",
    "to": "st-37",
    "transport": "bus"
  },
  {
    "from": "st-37",
    "to": "st-34",
    "transport": "bus"
  },
  {
    "from": "st-34",
    "to": "st-48",
    "transport": "bus"
  },
  {
    "from": "st-48",
    "to": "st-34",
    "transport": "bus"
  },
  {
    "from": "st-35",
    "to": "st-49",
    "transport": "bus"
  },
  {
    "from": "st-49",
    "to": "st-35",
    "transport": "bus"
  },
  {
    "from": "st-35",
    "to": "st-38",
    "transport": "bus"
  },
  {
    "from": "st-38",
    "to": "st-35",
    "transport": "bus"
  },
  {
    "from": "st-36",
    "to": "st-21",
    "transport": "bus"
  },
  {
    "from": "st-21",
    "to": "st-36",
    "transport": "bus"
  },
  {
    "from": "st-37",
    "to": "st-41",
    "transport": "bus"
  },
  {
    "from": "st-41",
    "to": "st-37",
    "transport": "bus"
  },
  {
    "from": "st-39",
    "to": "st-50",
    "transport": "bus"
  },
  {
    "from": "st-50",
    "to": "st-39",
    "transport": "bus"
  },
  {
    "from": "st-41",
    "to": "st-44",
    "transport": "bus"
  },
  {
    "from": "st-44",
    "to": "st-41",
    "transport": "bus"
  },
  {
    "from": "st-42",
    "to": "st-47",
    "transport": "bus"
  },
  {
    "from": "st-47",
    "to": "st-42",
    "transport": "bus"
  },
  {
    "from": "st-43",
    "to": "st-50",
    "transport": "bus"
  },
  {
    "from": "st-50",
    "to": "st-43",
    "transport": "bus"
  },
  {
    "from": "st-45",
    "to": "st-49",
    "transport": "bus"
  },
  {
    "from": "st-49",
    "to": "st-45",
    "transport": "bus"
  },
  {
    "from": "st-46",
    "to": "st-32",
    "transport": "bus"
  },
  {
    "from": "st-32",
    "to": "st-46",
    "transport": "bus"
  },
  {
    "from": "st-48",
    "to": "st-44",
    "transport": "bus"
  },
  {
    "from": "st-44",
    "to": "st-48",
    "transport": "bus"
  },
  {
    "from": "st-45",
    "to": "st-42",
    "transport": "metro"
  },
  {
    "from": "st-42",
    "to": "st-45",
    "transport": "metro"
  },
  {
    "from": "st-42",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-42",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-15",
    "transport": "metro"
  },
  {
    "from": "st-15",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-15",
    "to": "st-10",
    "transport": "metro"
  },
  {
    "from": "st-10",
    "to": "st-15",
    "transport": "metro"
  },
  {
    "from": "st-10",
    "to": "st-14",
    "transport": "metro"
  },
  {
    "from": "st-14",
    "to": "st-10",
    "transport": "metro"
  },
  {
    "from": "st-33",
    "to": "st-26",
    "transport": "metro"
  },
  {
    "from": "st-26",
    "to": "st-33",
    "transport": "metro"
  },
  {
    "from": "st-26",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-26",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-34",
    "transport": "metro"
  },
  {
    "from": "st-34",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-34",
    "to": "st-38",
    "transport": "metro"
  },
  {
    "from": "st-38",
    "to": "st-34",
    "transport": "metro"
  },
  {
    "from": "st-28",
    "to": "st-11",
    "transport": "metro"
  },
  {
    "from": "st-11",
    "to": "st-28",
    "transport": "metro"
  },
  {
    "from": "st-11",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-11",
    "transport": "metro"
  },
  {
    "from": "st-01",
    "to": "st-18",
    "transport": "metro"
  },
  {
    "from": "st-18",
    "to": "st-01",
    "transport": "metro"
  },
  {
    "from": "st-18",
    "to": "st-22",
    "transport": "metro"
  },
  {
    "from": "st-22",
    "to": "st-18",
    "transport": "metro"
  },
  {
    "from": "st-18",
    "to": "st-24",
    "transport": "metro"
  },
  {
    "from": "st-24",
    "to": "st-18",
    "transport": "metro"
  },
  {
    "from": "st-34",
    "to": "st-35",
    "transport": "metro"
  },
  {
    "from": "st-35",
    "to": "st-34",
    "transport": "metro"
  },
  {
    "from": "st-35",
    "to": "st-49",
    "transport": "metro"
  },
  {
    "from": "st-49",
    "to": "st-35",
    "transport": "metro"
  }
];

export const CITY_MAP: CityMap = {
  id: 'belle-rive',
  name: 'Belle-Rive',
  stations: STATIONS,
  connections: CONNECTIONS,
};

// Precomputed lookup maps for O(1) lookups
const stationMap = new Map<string, Station>(STATIONS.map((s) => [s.id, s]));

// Adjacency map: stationId -> list of connections from it
const outgoingMap = new Map<string, Connection[]>();
STATIONS.forEach((s) => outgoingMap.set(s.id, []));
CONNECTIONS.forEach((c) => {
  outgoingMap.get(c.from)?.push(c);
});

export function getStationById(id: string): Station | undefined {
  return stationMap.get(id);
}

export function getConnectionsFrom(stationId: string, transport?: TransportType): Connection[] {
  const list = outgoingMap.get(stationId) || [];
  if (!transport) return list;
  return list.filter((c) => c.transport === transport);
}

export function getNeighbors(stationId: string, transport?: TransportType): string[] {
  const conns = getConnectionsFrom(stationId, transport);
  const dests = new Set<string>();
  conns.forEach((c) => dests.add(c.to));
  return Array.from(dests);
}

export function isValidMove(fromId: string, toId: string, transport: TransportType): boolean {
  const list = outgoingMap.get(fromId) || [];
  return list.some((c) => c.to === toId && c.transport === transport);
}

export function getAvailableTransports(fromId: string, toId: string): TransportType[] {
  const list = outgoingMap.get(fromId) || [];
  const transports: TransportType[] = [];
  list.forEach((c) => {
    if (c.to === toId && !transports.includes(c.transport)) {
      transports.push(c.transport);
    }
  });
  return transports;
}

/**
 * BFS Shortest Path between any two stations on the graph
 */
export function findShortestPath(fromId: string, toId: string): string[] {
  if (fromId === toId) return [fromId];
  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    if (current === toId) return path;

    const neighbors = getNeighbors(current);
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }
  return [];
}

/**
 * Shortest path distance in number of hops
 */
export function getDistance(fromId: string, toId: string): number {
  const path = findShortestPath(fromId, toId);
  return path.length > 0 ? path.length - 1 : Infinity;
}
