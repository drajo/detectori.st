# Plan Implementacji: Platforma Katalogowania Znalezisk Detektorystów

## Przegląd

Implementacja pełnowartościowej platformy webowej SPA (React 18 + TypeScript) z backendowym API REST (Node.js + Express + TypeScript), bazą danych PostgreSQL (Prisma ORM) oraz przechowywaniem plików w S3/MinIO. Plan obejmuje uwierzytelnianie JWT, zarządzanie profilem, katalogowanie znalezisk ze zdjęciami i atrybutami, interaktywną mapę Leaflet oraz testy właściwości (fast-check).

## Zadania

- [x] 1. Konfiguracja struktury projektu i środowiska
  - Utwórz monorepo z katalogami `frontend/`, `backend/`, `shared/`
  - Skonfiguruj `package.json` z workspaces (npm/yarn workspaces)
  - Skonfiguruj TypeScript (`tsconfig.json`) dla każdego pakietu
  - Skonfiguruj ESLint + Prettier dla całego projektu
  - Utwórz plik `.env.example` z wymaganymi zmiennymi środowiskowymi
  - _Wymagania: wszystkie_

- [x] 2. Schemat bazy danych i konfiguracja backendu
  - [x] 2.1 Zainicjalizuj projekt backendowy (Express + TypeScript + Prisma)
    - Skonfiguruj Express z middleware: cors, helmet, express-json
    - Skonfiguruj Prisma z połączeniem do PostgreSQL
    - Utwórz schemat Prisma zgodnie z projektem (User, Session, VerificationToken, PasswordResetToken, Find, Photo, Attribute)
    - Uruchom pierwszą migrację Prisma
    - _Wymagania: 1.1, 2.1, 5.1_

  - [x] 2.2 Zdefiniuj współdzielone typy TypeScript
    - Utwórz `shared/types/` z interfejsami: `PaginatedResponse`, `Coordinates`, `FindMapMarker`, `FileValidationResult`, `ErrorResponse`
    - Zdefiniuj typy DTO dla żądań i odpowiedzi API
    - _Wymagania: 5.4, 8.3, 10.2_

  - [x] 2.3 Zaimplementuj globalną obsługę błędów i middleware walidacji
    - Utwórz middleware obsługi błędów z formatem `ErrorResponse`
    - Zaimplementuj kody błędów domenowych (AUTH_EMAIL_ALREADY_EXISTS, FIND_NAME_REQUIRED, itd.)
    - Skonfiguruj middleware walidacji danych wejściowych (zod lub express-validator)
    - _Wymagania: 1.3, 1.4, 1.5, 1.6, 5.3_

- [x] 3. Punkt kontrolny — weryfikacja konfiguracji backendu
  - Upewnij się, że serwer Express startuje bez błędów, Prisma łączy się z bazą danych, typy kompilują się poprawnie. Zapytaj użytkownika w razie wątpliwości.

- [x] 4. Implementacja uwierzytelniania — backend
  - [x] 4.1 Zaimplementuj rejestrację i weryfikację e-mail
    - Utwórz `POST /api/auth/register` — hashowanie hasła (bcrypt), tworzenie konta (nieaktywnego), generowanie tokenu weryfikacyjnego, wysyłka e-mail (Nodemailer)
    - Utwórz `GET /api/auth/verify` — aktywacja konta tokenem, przekierowanie do logowania
    - Zaimplementuj walidację: unikalność e-mail/username, długość hasła ≥ 8, zgodność haseł
    - _Wymagania: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.2 Napisz test właściwości dla unikalności danych rejestracji
    - **Właściwość 1: Unikalność danych rejestracji**
    - **Weryfikuje: Wymagania 1.3, 1.4, 3.3**

  - [ ]* 4.3 Napisz test właściwości dla walidacji hasła
    - **Właściwość 2: Walidacja hasła**
    - **Weryfikuje: Wymagania 1.5, 1.6, 4.4, 4.5**

  - [ ]* 4.4 Napisz test właściwości dla round-trip weryfikacji konta
    - **Właściwość 3: Weryfikacja konta — round trip**
    - **Weryfikuje: Wymagania 1.2, 1.7**

  - [x] 4.5 Zaimplementuj logowanie i zarządzanie sesjami JWT
    - Utwórz `POST /api/auth/login` — weryfikacja danych, generowanie access token (15 min) + refresh token (7 dni, httpOnly cookie), zapis sesji w bazie
    - Utwórz `POST /api/auth/logout` — unieważnienie refresh tokenu, usunięcie sesji
    - Utwórz `POST /api/auth/refresh` — rotacja tokenów (nowy refresh token, stary unieważniany), sliding expiration 60 min
    - Zaimplementuj middleware JWT do ochrony endpointów
    - _Wymagania: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.6 Napisz test właściwości dla bezpieczeństwa komunikatów błędów logowania
    - **Właściwość 4: Bezpieczeństwo komunikatów błędów logowania**
    - **Weryfikuje: Wymagania 2.3**

  - [ ]* 4.7 Napisz test właściwości dla unieważniania sesji po wylogowaniu
    - **Właściwość 5: Unieważnianie sesji po wylogowaniu**
    - **Weryfikuje: Wymagania 2.5**

  - [x] 4.8 Zaimplementuj reset hasła
    - Utwórz `POST /api/auth/forgot-password` — generowanie jednorazowego tokenu resetującego, wysyłka e-mail
    - Utwórz `POST /api/auth/reset-password` — walidacja tokenu (jednorazowy, ważność), zmiana hasła, unieważnienie tokenu
    - _Wymagania: 4.6_

  - [ ]* 4.9 Napisz test właściwości dla jednorazowego tokenu resetu hasła
    - **Właściwość 7: Reset hasła — jednorazowy token**
    - **Weryfikuje: Wymagania 4.6**

- [x] 5. Punkt kontrolny — weryfikacja uwierzytelniania
  - Upewnij się, że wszystkie endpointy auth działają poprawnie, tokeny JWT są generowane i walidowane, e-maile są wysyłane. Zapytaj użytkownika w razie wątpliwości.

- [x] 6. Zarządzanie profilem użytkownika — backend
  - [x] 6.1 Zaimplementuj endpointy profilu użytkownika
    - Utwórz `GET /api/users/me` — pobieranie danych profilu zalogowanego użytkownika
    - Utwórz `PATCH /api/users/me` — aktualizacja profilu (username, firstName, lastName, bio), walidacja unikalności username
    - Utwórz `PUT /api/users/me/password` — zmiana hasła z weryfikacją aktualnego, unieważnienie innych sesji
    - _Wymagania: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Napisz test właściwości dla zmiany hasła unieważniającej inne sesje
    - **Właściwość 6: Zmiana hasła unieważnia inne sesje**
    - **Weryfikuje: Wymagania 4.2**

  - [x] 6.3 Zaimplementuj wgrywanie avatara
    - Utwórz `POST /api/users/me/avatar` — walidacja pliku (JPEG/PNG/WebP, max 5 MB), generowanie miniatury (Sharp), upload do S3/MinIO, aktualizacja `avatarUrl` w bazie
    - _Wymagania: 3.4, 3.5_

  - [ ]* 6.4 Napisz test właściwości dla walidacji pliku graficznego (avatar)
    - **Właściwość 8: Walidacja pliku graficznego**
    - **Weryfikuje: Wymagania 3.4, 3.5, 6.2, 6.3**

- [x] 7. CRUD znalezisk — backend
  - [x] 7.1 Zaimplementuj tworzenie i pobieranie znalezisk
    - Utwórz `POST /api/finds` — walidacja (niepusta nazwa, zakres współrzędnych), zapis znaleziska przypisanego do użytkownika, przekierowanie do szczegółów
    - Utwórz `GET /api/finds/:id` — pobieranie szczegółów znaleziska (ze zdjęciami i atrybutami), weryfikacja własności
    - _Wymagania: 5.1, 5.2, 5.3, 5.4, 5.6, 9.1_

  - [ ]* 7.2 Napisz test właściwości dla walidacji współrzędnych geograficznych
    - **Właściwość 9: Walidacja współrzędnych geograficznych**
    - **Weryfikuje: Wymagania 5.4**

  - [ ]* 7.3 Napisz test właściwości dla round-trip tworzenia znaleziska
    - **Właściwość 10: Tworzenie znaleziska — round trip**
    - **Weryfikuje: Wymagania 5.2, 5.3**

  - [x] 7.4 Zaimplementuj aktualizację i usuwanie znalezisk
    - Utwórz `PATCH /api/finds/:id` — aktualizacja danych znaleziska, weryfikacja własności (403 dla cudzych)
    - Utwórz `DELETE /api/finds/:id` — kaskadowe usunięcie znaleziska, zdjęć (S3 + baza) i atrybutów, weryfikacja własności
    - _Wymagania: 9.2, 9.3, 9.4, 9.5_

  - [ ]* 7.5 Napisz test właściwości dla kaskadowego usuwania znaleziska
    - **Właściwość 19: Kaskadowe usuwanie znaleziska**
    - **Weryfikuje: Wymagania 9.5**

  - [x] 7.6 Zaimplementuj listowanie znalezisk z paginacją, wyszukiwaniem i sortowaniem
    - Utwórz `GET /api/finds` — paginacja (page, limit=20), wyszukiwanie full-text (name/description), sortowanie (createdAt, discoveryDate, name), filtrowanie po userId
    - _Wymagania: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.7 Napisz test właściwości dla poprawności sortowania listy znalezisk
    - **Właściwość 16: Poprawność sortowania listy znalezisk**
    - **Weryfikuje: Wymagania 8.1, 8.5**

  - [ ]* 7.8 Napisz test właściwości dla filtrowania wyszukiwania
    - **Właściwość 17: Filtrowanie wyszukiwania**
    - **Weryfikuje: Wymagania 8.4**

  - [ ]* 7.9 Napisz test właściwości dla paginacji
    - **Właściwość 18: Paginacja**
    - **Weryfikuje: Wymagania 8.3**

- [x] 8. Zarządzanie zdjęciami znalezisk — backend
  - [x] 8.1 Zaimplementuj wgrywanie zdjęć
    - Utwórz `POST /api/finds/:id/photos` — walidacja pliku (JPEG/PNG/WebP, max 10 MB), sprawdzenie limitu 10 zdjęć, generowanie miniatury (Sharp), upload oryginału i miniatury do S3/MinIO, zapis metadanych w bazie
    - _Wymagania: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.2 Napisz test właściwości dla limitu zdjęć znaleziska
    - **Właściwość 11: Limit zdjęć znaleziska**
    - **Weryfikuje: Wymagania 6.1**

  - [ ]* 8.3 Napisz test właściwości dla generowania miniatury
    - **Właściwość 12: Generowanie miniatury**
    - **Weryfikuje: Wymagania 6.4**

  - [x] 8.4 Zaimplementuj usuwanie zdjęć i zarządzanie okładką
    - Utwórz `DELETE /api/finds/:id/photos/:photoId` — usunięcie pliku i miniatury z S3, usunięcie rekordu z bazy
    - Utwórz `PATCH /api/finds/:id/photos/:photoId/cover` — ustawienie zdjęcia jako okładkowego (reset poprzedniego `isCover`, ustawienie nowego)
    - _Wymagania: 6.5, 6.6_

  - [ ]* 8.5 Napisz test właściwości dla kaskadowego usuwania zdjęcia
    - **Właściwość 13: Kaskadowe usuwanie zdjęcia**
    - **Weryfikuje: Wymagania 6.5**

  - [ ]* 8.6 Napisz test właściwości dla dokładnie jednego zdjęcia okładkowego
    - **Właściwość 14: Dokładnie jedno zdjęcie okładkowe**
    - **Weryfikuje: Wymagania 6.6**

- [x] 9. Atrybuty znalezisk — backend
  - [x] 9.1 Zaimplementuj CRUD atrybutów
    - Utwórz `POST /api/finds/:id/attributes` — walidacja niepustego klucza, zapis pary klucz-wartość
    - Utwórz `PATCH /api/finds/:id/attributes/:attrId` — aktualizacja wartości atrybutu
    - Utwórz `DELETE /api/finds/:id/attributes/:attrId` — trwałe usunięcie atrybutu
    - _Wymagania: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 9.2 Napisz test właściwości dla przechowywania atrybutów — round trip
    - **Właściwość 15: Przechowywanie atrybutów — round trip**
    - **Weryfikuje: Wymagania 7.1, 7.2, 7.3, 7.5**

- [x] 10. Endpoint mapy — backend
  - [x] 10.1 Zaimplementuj endpoint danych mapy
    - Utwórz `GET /api/finds/map` — pobieranie znalezisk z współrzędnymi (id, name, latitude, longitude, coverThumbnailUrl), filtrowanie po userId
    - _Wymagania: 10.1, 10.2_

  - [ ]* 10.2 Napisz test właściwości dla zawartości popupu mapy
    - **Właściwość 20: Zawartość popupu mapy**
    - **Weryfikuje: Wymagania 10.2**

- [x] 11. Punkt kontrolny — weryfikacja backendu
  - Upewnij się, że wszystkie endpointy API działają poprawnie, testy właściwości przechodzą, migracje bazy danych są aktualne. Zapytaj użytkownika w razie wątpliwości.

- [x] 12. Konfiguracja frontendu (React + TypeScript)
  - [x] 12.1 Zainicjalizuj projekt frontendowy
    - Skonfiguruj Vite + React 18 + TypeScript
    - Zainstaluj i skonfiguruj: React Router v6, Zustand, Tailwind CSS, Leaflet + React-Leaflet, Leaflet.markercluster
    - Skonfiguruj Vitest + React Testing Library
    - Utwórz strukturę katalogów: `components/`, `pages/`, `stores/`, `services/`, `hooks/`, `types/`
    - _Wymagania: wszystkie_

  - [x] 12.2 Zaimplementuj klienta API i interceptory
    - Utwórz `services/api.ts` — wrapper fetch/axios z bazowym URL, obsługą błędów
    - Zaimplementuj globalny interceptor 401 inicjujący odświeżenie access tokena
    - Utwórz serwisy dla każdego obszaru: `authService`, `userService`, `findsService`, `photosService`, `attributesService`
    - _Wymagania: 2.2, 2.5_

  - [x] 12.3 Zaimplementuj Zustand stores
    - Utwórz `authStore` — stan użytkownika, access token (w pamięci), metody login/logout/refresh
    - Utwórz `findsStore` — lista znalezisk, paginacja, filtry, sortowanie
    - Utwórz `mapStore` — markery mapy, stan klastrowania
    - _Wymagania: 2.2, 8.1, 10.1_

- [x] 13. Komponenty UI — podstawowe
  - [x] 13.1 Zaimplementuj komponenty bazowe UI
    - Utwórz komponenty: `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Toast`, `Spinner`, `Pagination`
    - Zastosuj Tailwind CSS, zapewnij dostępność (ARIA labels, role, focus management)
    - _Wymagania: wszystkie_

  - [x] 13.2 Zaimplementuj routing i layout aplikacji
    - Skonfiguruj React Router v6 z trasami: `/login`, `/register`, `/verify`, `/catalog`, `/finds/:id`, `/finds/new`, `/finds/:id/edit`, `/map`, `/profile`
    - Utwórz `ProtectedRoute` — przekierowanie do `/login` dla niezalogowanych
    - Utwórz `AppLayout` z nawigacją i stopką
    - _Wymagania: 2.2, 2.5_

- [x] 14. Moduł uwierzytelniania — frontend
  - [x] 14.1 Zaimplementuj formularze rejestracji i logowania
    - Utwórz `RegisterForm` — pola: email, username, password, confirmPassword; walidacja inline; obsługa błędów API (409 Conflict)
    - Utwórz `LoginForm` — pola: email, password; obsługa błędów 401/403
    - Utwórz strony: `RegisterPage`, `LoginPage`, `VerifyEmailPage` (obsługa tokenu z URL)
    - _Wymagania: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.3, 2.4_

  - [x] 14.2 Zaimplementuj wylogowanie i reset hasła
    - Dodaj przycisk wylogowania w nawigacji wywołujący `POST /api/auth/logout` i czyszczący store
    - Utwórz `ForgotPasswordPage` i `ResetPasswordPage` z formularzami
    - _Wymagania: 2.5, 4.6_

- [x] 15. Moduł profilu użytkownika — frontend
  - [x] 15.1 Zaimplementuj stronę profilu
    - Utwórz `ProfilePage` z formularzem edycji (username, firstName, lastName, bio)
    - Zaimplementuj upload avatara z podglądem, walidacją formatu/rozmiaru po stronie klienta
    - Utwórz formularz zmiany hasła (currentPassword, newPassword, confirmNewPassword)
    - _Wymagania: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 16. Moduł katalogu znalezisk — frontend
  - [x] 16.1 Zaimplementuj listę znalezisk
    - Utwórz `CatalogPage` z listą kart znalezisk (`FindCard` — miniatura, nazwa, data odkrycia, data dodania)
    - Zaimplementuj paginację, pole wyszukiwania (debounce), kontrolki sortowania
    - Obsłuż stany: ładowanie, pusta lista, błąd
    - _Wymagania: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 16.2 Zaimplementuj formularz dodawania/edycji znaleziska
    - Utwórz `FindForm` — pola: name, description, discoveryDate, latitude, longitude; walidacja inline
    - Zintegruj mini-mapę Leaflet do wyboru lokalizacji (klik na mapie → wypełnienie pól współrzędnych)
    - Utwórz `NewFindPage` i `EditFindPage` używające `FindForm`
    - _Wymagania: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.2, 9.3_

  - [x] 16.3 Zaimplementuj stronę szczegółów znaleziska
    - Utwórz `FindDetailPage` — galeria zdjęć, wszystkie pola znaleziska, lista atrybutów, mini-mapa z lokalizacją
    - Dodaj przyciski: edytuj, usuń (z modalem potwierdzenia)
    - _Wymagania: 9.1, 9.4, 9.5_

- [x] 17. Zarządzanie zdjęciami — frontend
  - [x] 17.1 Zaimplementuj komponent wgrywania zdjęć
    - Utwórz `PhotoUploader` — drag & drop lub wybór pliku, walidacja formatu/rozmiaru po stronie klienta, pasek postępu
    - Zintegruj z `FindDetailPage` — wyświetlanie siatki miniatur, przycisk usunięcia, przycisk ustawienia okładki
    - _Wymagania: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 18. Zarządzanie atrybutami — frontend
  - [x] 18.1 Zaimplementuj komponent atrybutów
    - Utwórz `AttributeManager` — lista par klucz-wartość, formularz dodawania (z sugestiami: materiał, epoka, stan zachowania, wymiary, waga), przyciski edycji i usunięcia
    - Zintegruj z `FindDetailPage`
    - _Wymagania: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 19. Moduł mapy — frontend
  - [x] 19.1 Zaimplementuj widok mapy znalezisk
    - Utwórz `MapPage` z pełnoekranową mapą Leaflet
    - Zintegruj Leaflet.markercluster — grupowanie znaczników gdy ≥ 6 w sąsiedztwie, rozgrupowanie przy przybliżeniu
    - Zaimplementuj popup znacznika: nazwa, miniatura okładki (lub placeholder), link do szczegółów
    - Obsłuż znaleziska bez współrzędnych (nie wyświetlaj na mapie)
    - _Wymagania: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 19.2 Napisz test właściwości dla klastrowania znaczników
    - **Właściwość 21: Klastrowanie znaczników**
    - **Weryfikuje: Wymagania 10.3, 10.5**

- [x] 20. Punkt kontrolny — weryfikacja frontendu
  - Upewnij się, że wszystkie strony renderują się poprawnie, przepływy użytkownika działają end-to-end, testy jednostkowe przechodzą. Zapytaj użytkownika w razie wątpliwości.

- [x] 21. Integracja i testy end-to-end
  - [x] 21.1 Zaimplementuj testy integracyjne przepływów E2E
    - Napisz testy integracyjne dla przepływu: rejestracja → weryfikacja e-mail → logowanie → dodanie znaleziska → wgranie zdjęcia → wylogowanie
    - Użyj testowej instancji PostgreSQL i mock S3 (MinIO lub aws-sdk-mock)
    - _Wymagania: 1.1–1.7, 2.1–2.5, 5.1–5.6, 6.1–6.6_

  - [x] 21.2 Podłącz frontend z backendem i zweryfikuj integrację
    - Skonfiguruj proxy Vite dla API w trybie deweloperskim
    - Zweryfikuj poprawność przepływu tokenów JWT (access token w pamięci, refresh token w httpOnly cookie)
    - Zweryfikuj obsługę wygaśnięcia sesji (automatyczne wylogowanie po 60 min nieaktywności)
    - _Wymagania: 2.2, 2.5, 2.6_

- [x] 22. Punkt kontrolny końcowy — weryfikacja całości
  - Upewnij się, że wszystkie testy (jednostkowe, właściwości, integracyjne) przechodzą, aplikacja kompiluje się bez błędów TypeScript, wszystkie wymagania są pokryte. Zapytaj użytkownika w razie wątpliwości.

## Uwagi

- Zadania oznaczone `*` są opcjonalne i mogą zostać pominięte dla szybszego MVP
- Każde zadanie odwołuje się do konkretnych wymagań dla pełnej identyfikowalności
- Punkty kontrolne zapewniają przyrostową walidację na każdym etapie
- Testy właściwości (fast-check) weryfikują 21 właściwości poprawności zdefiniowanych w projekcie
- Testy jednostkowe weryfikują konkretne scenariusze i przypadki brzegowe
- Testy integracyjne weryfikują przepływy end-to-end z rzeczywistą bazą danych
