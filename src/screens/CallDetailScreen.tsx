import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
  slaNotificationId?: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarChamado() {
      try {
        const chamadoRef = doc(
          db,
          'alunos',
          ALUNO_ID,
          'chamados',
          chamadoId
        );

        const snapshot = await getDoc(chamadoRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        console.log('Erro ao carregar chamado:', error);
        Alert.alert('Erro', 'Não foi possível carregar o chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    try {
      const chamadoRef = doc(
        db,
        'alunos',
        ALUNO_ID,
        'chamados',
        chamadoId
      );

      await updateDoc(chamadoRef, {
        status: novoStatus,
      });

      // Se o chamado foi atendido a tempo,
      // cancela o alerta de SLA que ainda não disparou
      if (
        (novoStatus === 'atendendo' || novoStatus === 'em andamento' || novoStatus === 'cancelado') &&
        chamado?.slaNotificationId
      ) {
        await Notifications.cancelScheduledNotificationAsync(chamado.slaNotificationId);
      }

      setChamado((atual) =>
        atual
          ? {
              ...atual,
              status: novoStatus,
            }
          : null
      );

      Alert.alert('Sucesso', 'Status atualizado com sucesso.');
    } catch (error) {
      console.log('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status do chamado.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Chamado não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Detalhes do Chamado</Text>

      <View style={styles.imageContainer}>
        {chamado.photoUri ? (
          <Image
            source={{ uri: chamado.photoUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.noImageText}>
            Nenhuma imagem anexada
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Descrição</Text>
        <Text style={styles.description}>{chamado.description}</Text>

        <Text style={styles.label}>Endereço</Text>
        <Text style={styles.info}>
          {chamado.address || 'Não informado'}
        </Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.status}>{chamado.status}</Text>
      </View>

      {chamado.status !== 'resolvido' && chamado.status !== 'cancelado' ? (
        <Text style={styles.actionTitle}>Alterar status</Text>
      ) : null}

      {chamado.status === 'aberto' ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('cancelado')}
        >
          <Text style={styles.buttonText}>Cancelar Chamado</Text>
        </TouchableOpacity>
      ) : null}

      {chamado.status === 'aberto' ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('em andamento')}
        >
          <Text style={styles.buttonText}>Iniciar Atendimento</Text>
        </TouchableOpacity>
      ) : null}

      {chamado.status === 'em andamento' || chamado.status === 'aberto' ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => mudarStatus('resolvido')}
        >
          <Text style={styles.buttonText}>Concluir Atendimento</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },

  description: {
    fontSize: 18,
    color: '#222',
  },

  info: {
    fontSize: 16,
    color: '#333',
  },

  status: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    textTransform: 'uppercase',
  },

  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  errorText: {
    fontSize: 16,
    color: '#c62828',
  },

  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  noImageText: {
    color: '#777',
    fontSize: 16,
  },
});
