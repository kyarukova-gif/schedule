// Сервер записи работает на том же сайте (Netlify), поэтому адрес не нужен.
// Даты, цены и Instagram меняются в netlify/lib/config.mjs
window.BOOKING = {
  apiUrl: "",
  // Видео по очереди: имена файлов из папки booking/media/ (к каждому .mp4 нужна картинка с тем же именем .jpg)
  videos: ["showreel.mp4", "reel-2.mp4"],
  // Показ фото: третьим пунктом после видео, фото сменяют друг друга. Файлы из booking/media/
  photos: ["christmas-01.jpg", "christmas-02.jpg", "christmas-03.jpg", "christmas-04.jpg", "christmas-05.jpg", "christmas-06.jpg", "christmas-07.jpg", "christmas-08.jpg", "christmas-09.jpg", "christmas-10.jpg", "christmas-11.jpg"]
};
