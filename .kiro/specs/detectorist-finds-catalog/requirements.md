# Dokument Wymagań

## Wprowadzenie

Platforma dla detektorystów to aplikacja webowa umożliwiająca użytkownikom katalogowanie znalezisk odkrytych przy użyciu wykrywaczy metali. System pozwala na rejestrację konta, zarządzanie profilem, dodawanie znalezisk wraz ze zdjęciami, współrzędnymi geograficznymi i atrybutami opisowymi, a także przeglądanie znalezisk na interaktywnej mapie.

## Słownik

- **System**: Platforma webowa dla detektorystów
- **Użytkownik**: Zarejestrowana osoba posiadająca konto w Systemie
- **Znalezisko**: Obiekt odkryty przez Użytkownika przy użyciu wykrywacza metali, opisany zestawem właściwości
- **Katalog**: Zbiór Znalezisk należących do danego Użytkownika
- **Atrybut**: Cecha opisowa Znaleziska zdefiniowana przez Użytkownika (np. materiał, epoka, stan zachowania)
- **Współrzędne**: Para wartości geograficznych (szerokość i długość geograficzna) wskazująca miejsce odkrycia Znaleziska
- **Zdjęcie**: Plik graficzny dokumentujący wygląd Znaleziska
- **Mapa**: Interaktywny widok kartograficzny prezentujący lokalizacje Znalezisk
- **Profil**: Zestaw danych osobowych i preferencji przypisanych do konta Użytkownika
- **Sesja**: Aktywny, uwierzytelniony kontekst pracy Użytkownika w Systemie

---

## Wymagania

### Wymaganie 1: Rejestracja konta

**User Story:** Jako nowy użytkownik, chcę zarejestrować konto w Systemie, aby móc katalogować swoje znaleziska.

#### Kryteria akceptacji

1. THE System SHALL udostępniać formularz rejestracji zawierający pola: adres e-mail, nazwa użytkownika, hasło oraz potwierdzenie hasła.
2. WHEN Użytkownik przesyła formularz rejestracji z poprawnymi danymi, THE System SHALL utworzyć nowe konto i wysłać wiadomość weryfikacyjną na podany adres e-mail.
3. IF podany adres e-mail jest już przypisany do istniejącego konta, THEN THE System SHALL zwrócić komunikat błędu informujący o zajętości adresu e-mail.
4. IF podana nazwa użytkownika jest już zajęta, THEN THE System SHALL zwrócić komunikat błędu informujący o zajętości nazwy użytkownika.
5. IF hasło i potwierdzenie hasła nie są identyczne, THEN THE System SHALL zwrócić komunikat błędu i nie utworzyć konta.
6. IF hasło ma mniej niż 8 znaków, THEN THE System SHALL zwrócić komunikat błędu informujący o minimalnej długości hasła.
7. WHEN Użytkownik kliknie link weryfikacyjny w wiadomości e-mail, THE System SHALL aktywować konto i przekierować Użytkownika do strony logowania.

---

### Wymaganie 2: Logowanie i wylogowanie

**User Story:** Jako zarejestrowany użytkownik, chcę zalogować się do Systemu, aby uzyskać dostęp do swojego Katalogu.

#### Kryteria akceptacji

1. THE System SHALL udostępniać formularz logowania zawierający pola: adres e-mail oraz hasło.
2. WHEN Użytkownik przesyła formularz logowania z poprawnymi danymi uwierzytelniającymi, THE System SHALL utworzyć Sesję i przekierować Użytkownika do strony głównej Katalogu.
3. IF podane dane uwierzytelniające są nieprawidłowe, THEN THE System SHALL zwrócić komunikat błędu bez wskazywania, które pole jest błędne.
4. IF konto Użytkownika nie zostało zweryfikowane, THEN THE System SHALL poinformować Użytkownika o konieczności weryfikacji adresu e-mail.
5. WHEN Użytkownik wybiera opcję wylogowania, THE System SHALL zakończyć Sesję i przekierować Użytkownika do strony logowania.
6. WHILE Sesja jest nieaktywna przez 60 minut, THE System SHALL automatycznie zakończyć Sesję.

---

### Wymaganie 3: Zarządzanie profilem użytkownika

**User Story:** Jako zalogowany użytkownik, chcę zarządzać danymi swojego Profilu, aby utrzymywać aktualne informacje o sobie.

#### Kryteria akceptacji

1. THE System SHALL udostępniać stronę Profilu zawierającą pola: nazwa użytkownika, imię, nazwisko, krótki opis (bio) oraz zdjęcie profilowe.
2. WHEN Użytkownik zapisuje zmiany w Profilu z poprawnymi danymi, THE System SHALL zaktualizować dane Profilu i wyświetlić potwierdzenie zapisu.
3. IF nowa nazwa użytkownika jest już zajęta przez inne konto, THEN THE System SHALL zwrócić komunikat błędu i nie zapisać zmian.
4. WHERE Użytkownik wgrywa zdjęcie profilowe, THE System SHALL akceptować pliki w formatach JPEG, PNG i WebP o rozmiarze nieprzekraczającym 5 MB.
5. IF wgrywany plik zdjęcia profilowego przekracza 5 MB lub ma nieobsługiwany format, THEN THE System SHALL zwrócić komunikat błędu i odrzucić plik.

---

### Wymaganie 4: Zmiana hasła

**User Story:** Jako zalogowany użytkownik, chcę zmienić swoje hasło, aby zachować bezpieczeństwo konta.

#### Kryteria akceptacji

1. THE System SHALL udostępniać formularz zmiany hasła zawierający pola: aktualne hasło, nowe hasło oraz potwierdzenie nowego hasła.
2. WHEN Użytkownik przesyła formularz zmiany hasła z poprawnymi danymi, THE System SHALL zaktualizować hasło i zakończyć wszystkie aktywne Sesje z wyjątkiem bieżącej.
3. IF podane aktualne hasło jest nieprawidłowe, THEN THE System SHALL zwrócić komunikat błędu i nie zmienić hasła.
4. IF nowe hasło i potwierdzenie nowego hasła nie są identyczne, THEN THE System SHALL zwrócić komunikat błędu i nie zmienić hasła.
5. IF nowe hasło ma mniej niż 8 znaków, THEN THE System SHALL zwrócić komunikat błędu informujący o minimalnej długości hasła.
6. THE System SHALL udostępniać mechanizm resetowania hasła dla Użytkowników, którzy zapomnieli aktualnego hasła, poprzez wysłanie jednorazowego linku resetującego na adres e-mail przypisany do konta.

---

### Wymaganie 5: Dodawanie znaleziska

**User Story:** Jako zalogowany użytkownik, chcę dodać nowe Znalezisko do swojego Katalogu, aby udokumentować odkrycie.

#### Kryteria akceptacji

1. THE System SHALL udostępniać formularz dodawania Znaleziska zawierający pola: nazwa, opis, data odkrycia, Współrzędne oraz Atrybuty.
2. WHEN Użytkownik przesyła formularz dodawania Znaleziska z wymaganymi polami, THE System SHALL zapisać Znalezisko i przypisać je do konta Użytkownika.
3. IF pole nazwy Znaleziska jest puste, THEN THE System SHALL zwrócić komunikat błędu i nie zapisać Znaleziska.
4. IF podane Współrzędne wykraczają poza zakres szerokości geograficznej od -90 do 90 stopni lub długości geograficznej od -180 do 180 stopni, THEN THE System SHALL zwrócić komunikat błędu walidacji.
5. WHERE Użytkownik wskazuje lokalizację na mapie w formularzu, THE System SHALL automatycznie wypełnić pola Współrzędnych na podstawie wybranego punktu.
6. WHEN Znalezisko zostanie pomyślnie zapisane, THE System SHALL przekierować Użytkownika do strony szczegółów Znaleziska.

---

### Wymaganie 6: Zarządzanie zdjęciami znaleziska

**User Story:** Jako zalogowany użytkownik, chcę wgrywać zdjęcia do Znaleziska, aby wizualnie udokumentować odkrycie.

#### Kryteria akceptacji

1. THE System SHALL umożliwiać wgrywanie do 10 Zdjęć na jedno Znalezisko.
2. WHEN Użytkownik wgrywa Zdjęcie do Znaleziska, THE System SHALL akceptować pliki w formatach JPEG, PNG i WebP o rozmiarze nieprzekraczającym 10 MB każdy.
3. IF wgrywany plik Zdjęcia przekracza 10 MB lub ma nieobsługiwany format, THEN THE System SHALL zwrócić komunikat błędu i odrzucić plik.
4. WHEN Zdjęcie zostanie pomyślnie wgrane, THE System SHALL wygenerować miniaturę Zdjęcia i wyświetlić ją na stronie szczegółów Znaleziska.
5. WHEN Użytkownik usuwa Zdjęcie ze Znaleziska, THE System SHALL trwale usunąć plik Zdjęcia i jego miniaturę.
6. WHERE Znalezisko posiada więcej niż jedno Zdjęcie, THE System SHALL umożliwiać Użytkownikowi wyznaczenie jednego Zdjęcia jako głównego (okładkowego).

---

### Wymaganie 7: Atrybuty znaleziska

**User Story:** Jako zalogowany użytkownik, chcę dodawać własne atrybuty do Znaleziska, aby szczegółowo opisać jego cechy.

#### Kryteria akceptacji

1. THE System SHALL umożliwiać dodawanie do Znaleziska dowolnej liczby Atrybutów w postaci par klucz-wartość.
2. WHEN Użytkownik dodaje Atrybut do Znaleziska, THE System SHALL zapisać parę klucz-wartość i wyświetlić ją na stronie szczegółów Znaleziska.
3. IF klucz Atrybutu jest pusty, THEN THE System SHALL zwrócić komunikat błędu i nie zapisać Atrybutu.
4. THE System SHALL udostępniać predefiniowane sugestie kluczy Atrybutów, takie jak: materiał, epoka, stan zachowania, wymiary, waga.
5. WHEN Użytkownik usuwa Atrybut ze Znaleziska, THE System SHALL trwale usunąć parę klucz-wartość.

---

### Wymaganie 8: Listowanie i wyszukiwanie znalezisk

**User Story:** Jako zalogowany użytkownik, chcę przeglądać listę swoich Znalezisk, aby zarządzać swoim Katalogiem.

#### Kryteria akceptacji

1. THE System SHALL wyświetlać listę Znalezisk zalogowanego Użytkownika posortowaną domyślnie według daty dodania od najnowszego.
2. THE System SHALL wyświetlać na liście dla każdego Znaleziska: miniaturę głównego Zdjęcia (jeśli istnieje), nazwę, datę odkrycia oraz datę dodania do Katalogu.
3. WHEN lista Znalezisk zawiera więcej niż 20 pozycji, THE System SHALL stosować paginację z możliwością nawigacji między stronami.
4. WHEN Użytkownik wprowadza frazę w polu wyszukiwania, THE System SHALL filtrować listę Znalezisk wyświetlając tylko te, których nazwa lub opis zawiera podaną frazę.
5. THE System SHALL umożliwiać sortowanie listy Znalezisk według: daty odkrycia, daty dodania oraz nazwy.

---

### Wymaganie 9: Szczegóły i edycja znaleziska

**User Story:** Jako zalogowany użytkownik, chcę przeglądać i edytować szczegóły Znaleziska, aby aktualizować informacje o odkryciu.

#### Kryteria akceptacji

1. THE System SHALL wyświetlać stronę szczegółów Znaleziska zawierającą: wszystkie Zdjęcia, nazwę, opis, datę odkrycia, Współrzędne, Atrybuty oraz miniaturę Mapy z zaznaczoną lokalizacją.
2. WHEN Użytkownik wybiera opcję edycji Znaleziska, THE System SHALL wyświetlić formularz edycji wypełniony aktualnymi danymi Znaleziska.
3. WHEN Użytkownik zapisuje zmiany w Znalezisku z poprawnymi danymi, THE System SHALL zaktualizować dane Znaleziska i wyświetlić potwierdzenie zapisu.
4. WHEN Użytkownik usuwa Znalezisko, THE System SHALL wyświetlić prośbę o potwierdzenie przed trwałym usunięciem.
5. WHEN Użytkownik potwierdza usunięcie Znaleziska, THE System SHALL trwale usunąć Znalezisko wraz ze wszystkimi powiązanymi Zdjęciami i Atrybutami.

---

### Wymaganie 10: Mapa znalezisk

**User Story:** Jako zalogowany użytkownik, chcę przeglądać swoje Znaleziska na interaktywnej Mapie, aby zobaczyć geograficzny rozkład odkryć.

#### Kryteria akceptacji

1. THE System SHALL wyświetlać interaktywną Mapę prezentującą lokalizacje wszystkich Znalezisk zalogowanego Użytkownika posiadających Współrzędne.
2. WHEN Użytkownik klika znacznik Znaleziska na Mapie, THE System SHALL wyświetlić podgląd zawierający nazwę, miniaturę głównego Zdjęcia (jeśli istnieje) oraz link do strony szczegółów Znaleziska.
3. WHERE liczba Znalezisk w bliskim sąsiedztwie przekracza 5, THE System SHALL grupować znaczniki w klastry z wyświetloną liczbą zgrupowanych Znalezisk.
4. THE System SHALL umożliwiać Użytkownikowi przybliżanie, oddalanie i przesuwanie widoku Mapy.
5. WHILE Użytkownik przybliża widok Mapy do poziomu, na którym klaster zawiera mniej niż 6 Znalezisk, THE System SHALL automatycznie rozgrupować klaster i wyświetlić indywidualne znaczniki.
