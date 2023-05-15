async function fetchData() {
    const url = 'https://moviesdatabase.p.rapidapi.com/titles';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '83150bbfd5msh952eb85bfd2a328p1bbcbcjsn5653dfab7c5f',
            'X-RapidAPI-Host': 'moviesdatabase.p.rapidapi.com'
        }
    };
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(result.results);

        document.getElementById("movies").innerHTML = result.results.map(item => `<li>${item.titleText.text}</li>`).join('');
    } catch (error) {
        console.error(error);
    }


}
