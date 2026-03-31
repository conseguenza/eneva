export const MOVIE_ROWS = [
  { 
    key: "trending", 
    title: "In Tendenza", 
    description: "I film più visti e discussi in questo momento su TMDB.", 
    endpoint: "trending/movie/week" 
  },
  { 
    key: "popular", 
    title: "Film Popolari", 
    description: "I titoli più amati dal pubblico internazionale.", 
    endpoint: "movie/popular" 
  },
  { 
    key: "top_rated", 
    title: "I Migliori Film", 
    description: "I film con le valutazioni più alte dalla critica e dal pubblico.", 
    endpoint: "movie/top_rated" 
  },
  { 
    key: "action", 
    title: "Azione Esplosiva", 
    description: "Adrenalina pura, inseguimenti e combattimenti epici.", 
    discover: { with_genres: "28", sort_by: "popularity.desc" } 
  },
  { 
    key: "comedy", 
    title: "Commedie Imperdibili", 
    description: "Risate garantite con le migliori commedie.", 
    discover: { with_genres: "35", sort_by: "popularity.desc" } 
  },
  { 
    key: "horror", 
    title: "Horror & Thriller", 
    description: "Film che ti faranno saltare sulla sedia.", 
    discover: { with_genres: "27", sort_by: "popularity.desc" } 
  },
  { 
    key: "romance", 
    title: "Film Romantici", 
    description: "Storie d'amore che ti faranno emozionare.", 
    discover: { with_genres: "10749", sort_by: "popularity.desc" } 
  },
  { 
    key: "sci_fi", 
    title: "Fantascienza", 
    description: "Viaggi nello spazio, futuro e mondi paralleli.", 
    discover: { with_genres: "878", sort_by: "popularity.desc" } 
  },
  { 
    key: "drama", 
    title: "Drammi Intensi", 
    description: "Storie profonde e personaggi indimenticabili.", 
    discover: { with_genres: "18", sort_by: "popularity.desc" } 
  },
  { 
    key: "thriller", 
    title: "Thriller Avvincenti", 
    description: "Suspense e colpi di scena mozzafiato.", 
    discover: { with_genres: "53", sort_by: "popularity.desc" } 
  },
  { 
    key: "animation", 
    title: "Animazione", 
    description: "Magia e avventure per tutte le età.", 
    discover: { with_genres: "16", sort_by: "popularity.desc" } 
  },
  { 
    key: "fantasy", 
    title: "Fantasy Epico", 
    description: "Mondi magici e creature leggendarie.", 
    discover: { with_genres: "14", sort_by: "popularity.desc" } 
  }
];

export const TV_ROWS = [
  { 
    key: "trending_tv", 
    title: "Serie del Momento", 
    description: "Le serie TV più discusse della settimana.", 
    endpoint: "trending/tv/week" 
  },
  { 
    key: "popular_tv", 
    title: "Serie Più Viste", 
    description: "I grandi ritorni e le nuove scoperte.", 
    endpoint: "tv/popular" 
  },
  { 
    key: "top_tv", 
    title: "Le Migliori Serie", 
    description: "Le serie con le valutazioni più alte di sempre.", 
    endpoint: "tv/top_rated" 
  },
  { 
    key: "crime_tv", 
    title: "Crime & Investigazioni", 
    description: "Gialli, polizieschi e storie criminali avvincenti.", 
    discover: { with_genres: "80", sort_by: "popularity.desc" } 
  },
  { 
    key: "drama_tv", 
    title: "Drammi Moderni", 
    description: "Storie intense e personaggi complessi.", 
    discover: { with_genres: "18", sort_by: "popularity.desc" } 
  },
  { 
    key: "mystery_tv", 
    title: "Misteri da Risolvere", 
    description: "Segreti, intrighi e verità nascoste.", 
    discover: { with_genres: "9648", sort_by: "popularity.desc" } 
  },
  { 
    key: "comedy_tv", 
    title: "Serie Comiche", 
    description: "Risate e leggerezza per tutti i giorni.", 
    discover: { with_genres: "35", sort_by: "popularity.desc" } 
  },
  { 
    key: "sci_fi_tv", 
    title: "Fantascienza TV", 
    description: "Universi alternativi e tecnologia futuristica.", 
    discover: { with_genres: "878", sort_by: "popularity.desc" } 
  },
  { 
    key: "action_tv", 
    title: "Azione & Avventura", 
    description: "Serie ricche di azione e colpi di scena.", 
    discover: { with_genres: "10759", sort_by: "popularity.desc" } 
  },
  { 
    key: "animation_tv", 
    title: "Serie Animate", 
    description: "Animazione giapponese e occidentale di qualità.", 
    discover: { with_genres: "16", sort_by: "popularity.desc" } 
  },
  { 
    key: "family_tv", 
    title: "Per Tutta la Famiglia", 
    description: "Serie da guardare insieme in famiglia.", 
    discover: { with_genres: "10751", sort_by: "popularity.desc" } 
  },
  { 
    key: "documentary_tv", 
    title: "Documentari", 
    description: "Storie vere e approfondimenti culturali.", 
    discover: { with_genres: "99", sort_by: "popularity.desc" } 
  }
];