# Treenipäiväkirja – iPhone PWA

Suomenkielinen, paikallisesti toimiva kuntosaliharjoittelun seurantasovellus.

## Ominaisuudet
- Harjoitusten kirjaus: liikkeet, sarjat, painot ja toistot
- Harjoitushistoria ja yksittäisen treenin tarkastelu
- Liikepankki ja omien liikkeiden lisääminen
- Volyymi- ja liikekohtaiset kehityskäyrät
- Kirjattujen työsarjapainojen ennätykset
- JSON-varmuuskopiointi ja palautus
- Offline-välimuisti Service Workerilla

## Tietosuoja
Harjoitustiedot tallennetaan selaimen localStorage-tallennustilaan samalla laitteella. Sovellus ei sisällä analytiikkaa, mainoksia, kirjautumista eikä verkkopyyntöjä. Sovelluksen tiedostot voi julkaista staattisena HTTPS-sivuna; julkaisu ei siirrä harjoitustietoja palvelimelle.

**Tärkeää:** iOS voi tyhjentää verkkosivuston paikallista dataa tallennustilan hallinnan yhteydessä. Vie varmuuskopio säännöllisesti. Älä poista sovellusta tai tyhjennä Safari-verkkosivustotietoja ennen varmuuskopion tekemistä.

## Asennus iPhoneen
PWA vaatii HTTPS-osoitteen (tai kehityksessä localhost). Kun tiedostot on julkaistu HTTPS-palvelimelle:
1. Avaa sovelluksen osoite iPhonen Safarissa.
2. Paina Jaa-kuvaketta.
3. Valitse **Lisää Koti-valikkoon**.
4. Avaa sovellus kotinäytön kuvakkeesta.
5. Avaa se kerran verkossa, jotta offline-tiedostot tallentuvat välimuistiin.

Tämän jälkeen sovelluksen käyttö ja harjoitustietojen tallennus tapahtuvat paikallisesti.

## Paikallinen kehitys
Aja projektikansiossa esimerkiksi:
`python3 -m http.server 8000`
Avaa tietokoneella `http://localhost:8000`. iPhone-testaukseen tarvitaan HTTPS-julkaisu tai paikallisverkossa kehityspalvelin, jossa on luotettu HTTPS.

## Varmuuskopio
Napauta yläreunan ylänuolta ja tallenna JSON-tiedosto Tiedostot-sovellukseen. Palautus: napauta alanuolta ja valitse aiemmin viety JSON-varmuuskopio.
