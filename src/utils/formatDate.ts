import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const formatDate = (date: string) =>
  format(new Date(date), 'dd MMM yyy', {
    locale: ptBR,
  });
