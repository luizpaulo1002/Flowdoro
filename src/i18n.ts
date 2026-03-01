import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const resourcesEN = {
  translation: {
    app: {
      title: 'FLOWDORO',
      flowStateActive: 'Flow state active',
      restPhase: 'Rest phase',
      paused: 'Paused',
      readyToFocus: 'Ready to focus',
      enterFlow: 'Enter Flow',
      pause: 'Pause',
      resume: 'Resume',
      stopAndRest: 'Stop & Rest',
      skipBreak: 'Skip Break',
      todaysSessions: 'Today\'s Sessions',
      noSessions: 'No sessions yet.',
      min: 'min',
      exportData: 'Export Data',
      importData: 'Import Data',
      timerTab: 'Timer',
      cycleTab: 'Cycle Planner',
      settings: 'Settings',
      language: 'Language',
      restPercentage: 'Rest Percentage',
      restPercentageDesc: 'Ratio of rest time based on work time.',
      version: 'Version',
      dailyProgress: 'Daily Progress',
      focusTime: 'Focus',
      restTime: 'Rest',
      deleteSession: 'Delete Session?',
      deleteConfirmMsg: 'Are you sure you want to delete this study session?',
      dontAskAgain: 'Don\'t ask me again',
      cancel: 'Cancel',
      delete: 'Delete'
    },
    cycle: {
      title: 'Your Study Cycle',
      export: 'Export Cycle',
      import: 'Import Cycle',
      totalHours: 'Total Cycle Hours',
      addSubject: 'Add Subject',
      subjectName: 'Subject Name',
      difficulty: 'Difficulty',
      difficultyLabels: ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'],
      volume: 'Volume',
      volumeLabels: ['Very Little', 'Little', 'Average', 'Large', 'Very Large'],
      weight: 'Weight',
      color: 'Color',
      addBtn: 'Add to Cycle',
      empty: 'No subjects added to the cycle yet. Add one below!',
      hoursLimit: 'The cycle intensity affects the total hours distributed, not the weekly deadline.',
      actions: 'Actions',
      delete: 'Remove'
    }
  }
};

// Portuguese translations
const resourcesPT = {
  translation: {
    app: {
      title: 'FLOWDORO',
      flowStateActive: 'Estado de Flow',
      restPhase: 'Fase de Descanso',
      paused: 'Pausado',
      readyToFocus: 'Pronto para focar',
      enterFlow: 'Iniciar Flow',
      pause: 'Pausar',
      resume: 'Continuar',
      stopAndRest: 'Parar e Descansar',
      skipBreak: 'Pular Intervalo',
      todaysSessions: 'Sessões de Hoje',
      noSessions: 'Nenhuma sessão ainda.',
      min: 'min',
      exportData: 'Exportar Dados',
      importData: 'Importar Dados',
      timerTab: 'Temporizador',
      cycleTab: 'Ciclo de Estudos',
      settings: 'Configurações',
      language: 'Idioma',
      restPercentage: 'Porcentagem de Descanso',
      restPercentageDesc: 'Proporção de tempo de descanso com base no tempo de foco.',
      version: 'Versão',
      dailyProgress: 'Progresso Diário',
      focusTime: 'Foco',
      restTime: 'Descanso',
      deleteSession: 'Excluir Sessão?',
      deleteConfirmMsg: 'Tem certeza que deseja excluir esta sessão de estudos?',
      dontAskAgain: 'Não perguntar novamente',
      cancel: 'Cancelar',
      delete: 'Excluir'
    },
    cycle: {
      title: 'Seu Ciclo de Estudos',
      export: 'Exportar Ciclo',
      import: 'Importar Ciclo',
      totalHours: 'Horas Totais do Ciclo',
      addSubject: 'Adicionar Matéria',
      subjectName: 'Nome da Matéria',
      difficulty: 'Dificuldade',
      difficultyLabels: ['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Muito Difícil'],
      volume: 'Volume de Conteúdo',
      volumeLabels: ['Muito Pouco', 'Pouco', 'Médio', 'Muito', 'Demais'],
      weight: 'Peso',
      color: 'Cor',
      addBtn: 'Adicionar ao Ciclo',
      empty: 'Nenhuma matéria no ciclo. Adicione uma abaixo!',
      hoursLimit: 'A intensidade do ciclo define o total de horas distribuídas, mas não possui prazo fixo na semana.',
      actions: 'Ações',
      delete: 'Remover'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: resourcesEN,
      pt: resourcesPT
    },
    lng: 'pt', // Default to Portuguese
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;
