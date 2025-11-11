import { gql } from '@apollo/client';

// ============= AUTH =============
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      usuario {
        idUsuario
        email
        rol
      }
    }
  }
`;

// ============= CLIENTES =============
export const GET_CLIENTES = gql`
  query GetClientes($limit: Int, $offset: Int) {
    clientes(limit: $limit, offset: $offset) {
      idCliente
      nombreCompleto
      contactoEmail
      contactoTel
      direccion
      fechaRegistro
    }
  }
`;

export const GET_CLIENTE = gql`
  query GetCliente($id: Int!) {
    cliente(id: $id) {
      idCliente
      nombreCompleto
      contactoEmail
      contactoTel
      direccion
      fechaRegistro
    }
  }
`;

export const CREATE_CLIENTE = gql`
  mutation CreateCliente(
    $nombreCompleto: String!
    $contactoEmail: String
    $contactoTel: String
    $direccion: String
  ) {
    createCliente(input: {
      nombreCompleto: $nombreCompleto
      contactoEmail: $contactoEmail
      contactoTel: $contactoTel
      direccion: $direccion
    }) {
      idCliente
      nombreCompleto
      contactoEmail
      contactoTel
      direccion
      fechaRegistro
    }
  }
`;

// ============= EXPEDIENTES =============
export const GET_EXPEDIENTES = gql`
  query GetExpedientes($limit: Int, $offset: Int, $idCliente: Int, $estado: EstadoExpediente, $q: String) {
    expedientes(limit: $limit, offset: $offset, idCliente: $idCliente, estado: $estado, q: $q) {
      idExpediente
      idCliente
      titulo
      descripcion
      estado
      fechaInicio
      fechaCierre
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_EXPEDIENTE = gql`
  query GetExpediente($id: Int!) {
    expediente(id: $id) {
      idExpediente
      idCliente
      titulo
      descripcion
      estado
      fechaInicio
      fechaCierre
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const CREATE_EXPEDIENTE = gql`
  mutation CreateExpediente(
    $idCliente: Int!
    $titulo: String!
    $descripcion: String
    $estado: EstadoExpediente
  ) {
    createExpediente(input: {
      idCliente: $idCliente
      titulo: $titulo
      descripcion: $descripcion
      estado: $estado
    }) {
      idExpediente
      idCliente
      titulo
      descripcion
      estado
      fechaInicio
    }
  }
`;

export const UPDATE_EXPEDIENTE = gql`
  mutation UpdateExpediente(
    $id: Int!
    $titulo: String
    $descripcion: String
    $estado: EstadoExpediente
  ) {
    updateExpediente(id: $id, input: {
      titulo: $titulo
      descripcion: $descripcion
      estado: $estado
    }) {
      idExpediente
      titulo
      descripcion
      estado
      fechaActualizacion
    }
  }
`;

export const DELETE_EXPEDIENTE = gql`
  mutation DeleteExpediente($id: Int!) {
    deleteExpediente(id: $id) {
      success
      message
    }
  }
`;

// ============= NOTAS =============
export const GET_NOTAS_EXPEDIENTE = gql`
  query GetNotasExpediente($idExpediente: Int!) {
    notasExpediente(idExpediente: $idExpediente) {
      idNota
      idExpediente
      contenido
      tipo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_NOTA = gql`
  query GetNota($id: Int!) {
    nota(id: $id) {
      idNota
      idExpediente
      contenido
      tipo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const CREATE_NOTA = gql`
  mutation CreateNota(
    $idExpediente: Int!
    $contenido: String!
    $tipo: String
  ) {
    createNota(input: {
      idExpediente: $idExpediente
      contenido: $contenido
      tipo: $tipo
    }) {
      idNota
      idExpediente
      contenido
      tipo
      fechaCreacion
    }
  }
`;

export const UPDATE_NOTA = gql`
  mutation UpdateNota(
    $id: Int!
    $contenido: String
    $tipo: String
  ) {
    updateNota(id: $id, input: {
      contenido: $contenido
      tipo: $tipo
    }) {
      idNota
      contenido
      tipo
      fechaActualizacion
    }
  }
`;

export const DELETE_NOTA = gql`
  mutation DeleteNota($id: Int!) {
    deleteNota(id: $id) {
      success
      message
    }
  }
`;

// ============= PLAZOS =============
export const GET_PLAZOS_EXPEDIENTE = gql`
  query GetPlazosExpediente($idExpediente: Int!) {
    plazosExpediente(idExpediente: $idExpediente) {
      idPlazo
      idExpediente
      descripcion
      fechaVencimiento
      cumplido
      fechaCumplimiento
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_PLAZO = gql`
  query GetPlazo($idPlazo: Int!) {
    plazo(idPlazo: $idPlazo) {
      idPlazo
      idExpediente
      descripcion
      fechaVencimiento
      cumplido
      fechaCumplimiento
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const CREATE_PLAZO = gql`
  mutation CreatePlazo(
    $idExpediente: Int!
    $descripcion: String!
    $fechaVencimiento: String!
  ) {
    createPlazo(input: {
      idExpediente: $idExpediente
      descripcion: $descripcion
      fechaVencimiento: $fechaVencimiento
    }) {
      idPlazo
      idExpediente
      descripcion
      fechaVencimiento
      cumplido
    }
  }
`;

export const UPDATE_PLAZO = gql`
  mutation UpdatePlazo(
    $idPlazo: Int!
    $descripcion: String
    $fechaVencimiento: String
  ) {
    updatePlazo(idPlazo: $idPlazo, input: {
      descripcion: $descripcion
      fechaVencimiento: $fechaVencimiento
    }) {
      idPlazo
      descripcion
      fechaVencimiento
      fechaActualizacion
    }
  }
`;

export const MARCAR_PLAZO_CUMPLIDO = gql`
  mutation MarcarPlazoCumplido($idPlazo: Int!) {
    marcarPlazoCumplido(idPlazo: $idPlazo) {
      idPlazo
      cumplido
      fechaCumplimiento
    }
  }
`;

export const DELETE_PLAZO = gql`
  mutation DeletePlazo($idPlazo: Int!) {
    deletePlazo(idPlazo: $idPlazo) {
      success
      message
    }
  }
`;

// ============= DOCUMENTOS =============
// NOTA: Upload de documentos se hace por REST directo (multipart/form-data)
// Solo listar y eliminar están en GraphQL

export const GET_ADMIN_DOCUMENTOS = gql`
  query GetAdminDocumentos($limit: Int, $offset: Int) {
    adminDocumentos(limit: $limit, offset: $offset) {
      id
      docId
      filename
      size
      idCliente
      idExpediente
      createdAt
    }
  }
`;

export const GET_DOCUMENTOS_EXPEDIENTE = gql`
  query GetDocumentosExpediente($idExpediente: Int!) {
    documentosExpediente(idExpediente: $idExpediente) {
      id
      docId
      filename
      size
      idCliente
      idExpediente
      createdAt
    }
  }
`;

export const GET_MIS_DOCUMENTOS = gql`
  query GetMisDocumentos {
    misDocumentos {
      id
      docId
      filename
      size
      idCliente
      idExpediente
      createdAt
    }
  }
`;

export const SUBIR_DOCUMENTO = gql`
  mutation SubirDocumento($idExpediente: Int!, $file: Upload!) {
    subirDocumento(idExpediente: $idExpediente, file: $file) {
      docId
      filename
      size
      idExpediente
    }
  }
`;

export const DELETE_DOCUMENTO = gql`
  mutation DeleteDocumento($docId: String!) {
    eliminarDocumento(docId: $docId) {
      success
      message
    }
  }
`;

// ============= MACHINE LEARNING =============
// NOTA: Solo estas 3 queries están disponibles en GraphQL.
// Los demás endpoints ML (clusters de plazos, anomalías de docs, near-duplicados, 
// autoencoders, regresión) deben seguir usando REST directo.

export const ML_PROB_RIESGO = gql`
  query MLProbRiesgo {
    mlProbRiesgo {
      status
      model
      accuracy
      total
      predictions {
        idPlazo
        descripcion
        fechaVencimiento
        cumplido
        idExpediente
        probabilidadRiesgo
        features
      }
    }
  }
`;

export const ML_DOCS_CLUSTERS = gql`
  query MLDocsClusters($k: Int) {
    mlDocsClusters(k: $k) {
      status
      nClusters
      nSamples
      assignments {
        docId
        filename
        cluster
        idExpediente
        idCliente
        features
      }
    }
  }
`;

export const ML_PLAZOS_ANOMALIAS = gql`
  query MLPlazosAnomalias($contaminacion: Float, $maxLista: Int, $explain: Boolean) {
    mlPlazosAnomalias(contaminacion: $contaminacion, maxLista: $maxLista, explain: $explain) {
      status
      nSamples
      numAnomalos
      contaminacion
      features
      top {
        idPlazo
        descripcion
        fechaVencimiento
        cumplido
        idExpediente
        score
        features
      }
    }
  }
`;

