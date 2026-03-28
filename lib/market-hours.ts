export function isMarketOpen(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();

  // Weekend
  if (day === 0 || day === 6) return false;

  const time = hours * 60 + minutes;
  const morningOpen = 9 * 60 + 30; // 9:30
  const morningClose = 11 * 60 + 30; // 11:30
  const afternoonOpen = 13 * 60; // 13:00
  const afternoonClose = 15 * 60; // 15:00

  return (
    (time >= morningOpen && time <= morningClose) ||
    (time >= afternoonOpen && time <= afternoonClose)
  );
}

export function getMarketStatus(): {
  label: string;
  isOpen: boolean;
} {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) {
    return { label: "休市", isOpen: false };
  }

  const morningOpen = 9 * 60 + 30;
  const morningClose = 11 * 60 + 30;
  const afternoonOpen = 13 * 60;
  const afternoonClose = 15 * 60;

  if (time < morningOpen) {
    return { label: "未开盘", isOpen: false };
  }
  if (time >= morningOpen && time <= morningClose) {
    return { label: "交易中", isOpen: true };
  }
  if (time > morningClose && time < afternoonOpen) {
    return { label: "午间休市", isOpen: false };
  }
  if (time >= afternoonOpen && time <= afternoonClose) {
    return { label: "交易中", isOpen: true };
  }
  return { label: "已收盘", isOpen: false };
}
