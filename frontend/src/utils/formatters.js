import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatMonth(monthNumber) {
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return meses[monthNumber - 1] || monthNumber;
}

export function formatMonthFull(monthNumber) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[monthNumber - 1] || monthNumber;
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

export function toInputDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}
