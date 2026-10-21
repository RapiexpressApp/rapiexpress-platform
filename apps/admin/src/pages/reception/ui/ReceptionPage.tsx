import { Heading, Stack, Text } from '@chakra-ui/react';
import { useEffect, useReducer, useRef } from 'react';

import { classifyReceiveError } from '@/features/reception/model/reception-errors';
import {
  canChooseAnotherTarget,
  getStepNumber,
  INITIAL_RECEPTION_STATE,
  isDuplicatePending,
  receptionReducer,
} from '@/features/reception/model/reception-flow';
import { buildReceivePayload } from '@/features/reception/model/reception-payload';
import { useReceivePackage } from '@/features/reception/model/use-receive-package';
import { useReceptionLookup } from '@/features/reception/model/use-reception-lookup';
import DuplicateWarning from '@/features/reception/ui/DuplicateWarning';
import ReceptionForm from '@/features/reception/ui/ReceptionForm';
import ReceptionNotice from '@/features/reception/ui/ReceptionNotice';
import ReceptionSuccess from '@/features/reception/ui/ReceptionSuccess';
import ReceptionSummary from '@/features/reception/ui/ReceptionSummary';
import ScanStep from '@/features/reception/ui/ScanStep';
import TargetStep from '@/features/reception/ui/TargetStep';

const STEP_COUNT = 4;
const STEP_LABEL: Record<number, string> = {
  1: 'Escanear guía',
  2: 'Destino del bulto',
  3: 'Datos del bulto',
  4: 'Confirmar',
};

function ReceptionPage() {
  const [state, dispatch] = useReducer(receptionReducer, INITIAL_RECEPTION_STATE);
  const lookup = useReceptionLookup();
  const receive = useReceivePackage();
  const lookupInFlight = useRef(false);
  const receiveInFlight = useRef(false);

  useEffect(() => {
    document.title = 'Recepción · Rapiexpress';
  }, []);

  function runLookup(trackingNumber: string) {
    if (lookupInFlight.current) return;
    lookupInFlight.current = true;

    lookup.mutate(trackingNumber, {
      onSuccess: (result) => {
        lookupInFlight.current = false;
        dispatch({ type: 'looked-up', trackingNumber, lookup: result });
      },
      onError: () => {
        lookupInFlight.current = false;
      },
    });
  }

  function restart() {
    lookupInFlight.current = false;
    receiveInFlight.current = false;
    receive.reset();
    lookup.reset();
    dispatch({ type: 'restarted' });
  }

  function handleScan(trackingNumber: string) {
    if (lookupInFlight.current) return;
    receive.reset();
    dispatch({ type: 'restarted' });
    runLookup(trackingNumber);
  }

  function handleConfirm() {
    if (receiveInFlight.current || !state.trackingNumber || !state.target || !state.values) return;
    receiveInFlight.current = true;

    receive.mutate(
      buildReceivePayload({
        trackingNumber: state.trackingNumber,
        target: state.target,
        values: state.values,
        confirmDuplicate: state.duplicate?.confirmed,
      }),
      {
        onSuccess: (received) => {
          receiveInFlight.current = false;
          dispatch({ type: 'received', received });
        },
        onError: (error) => {
          receiveInFlight.current = false;
          handleReceiveFailure(error);
        },
      }
    );
  }

  function handleReceiveFailure(error: unknown) {
    const failure = classifyReceiveError(error);
    if (failure.kind === 'generic') return;

    receive.reset();
    if (failure.kind === 'duplicate') {
      dispatch({ type: 'duplicate-detected', packages: failure.packages });
    } else if (failure.kind === 'customer-inactive') {
      dispatch({ type: 'customer-rejected', message: failure.message });
    } else {
      dispatch({ type: 'relookup-requested', message: failure.message });
      if (state.trackingNumber) runLookup(state.trackingNumber);
    }
  }

  function handleEdit() {
    receive.reset();
    dispatch({ type: 'details-reopened' });
  }

  const step = getStepNumber(state);
  const receiveFailure = receive.isError ? classifyReceiveError(receive.error) : null;

  return (
    <Stack gap={6} maxW="2xl">
      <Stack gap={1}>
        <Heading as="h1" size="xl" color="slate.900">
          Recepción
        </Heading>
        {step !== null && (
          <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
            Paso {step} de {STEP_COUNT} · {STEP_LABEL[step]}
          </Text>
        )}
      </Stack>

      {state.notice && (
        <ReceptionNotice
          message={state.notice}
          onDismiss={() => dispatch({ type: 'notice-dismissed' })}
        />
      )}

      {renderStep()}
    </Stack>
  );

  function renderStep() {
    if (state.phase === 'done' && state.received) {
      return <ReceptionSuccess received={state.received} onAnother={restart} />;
    }

    if (isDuplicatePending(state) && state.duplicate) {
      return (
        <DuplicateWarning
          packages={state.duplicate.packages}
          onConfirm={() => dispatch({ type: 'duplicate-confirmed' })}
          onCancel={restart}
        />
      );
    }

    if (state.phase === 'target' && state.lookup) {
      return (
        <TargetStep
          lookup={state.lookup}
          onChoose={(target) => dispatch({ type: 'target-chosen', target })}
          onRestart={restart}
        />
      );
    }

    if (state.phase === 'details' && state.target && state.formInput) {
      return (
        <ReceptionForm
          target={state.target}
          defaultValues={state.formInput}
          onSubmit={(input, values) => dispatch({ type: 'details-submitted', input, values })}
          onCancel={restart}
          onChangeTarget={
            canChooseAnotherTarget(state) ? () => dispatch({ type: 'target-reopened' }) : undefined
          }
        />
      );
    }

    if (state.phase === 'confirm' && state.trackingNumber && state.target && state.values) {
      return (
        <ReceptionSummary
          trackingNumber={state.trackingNumber}
          target={state.target}
          values={state.values}
          duplicateConfirmed={state.duplicate?.confirmed === true}
          pending={receive.isPending}
          errorMessage={receiveFailure?.kind === 'generic' ? receiveFailure.message : undefined}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      );
    }

    return (
      <ScanStep
        initialValue={state.trackingNumber ?? ''}
        pending={lookup.isPending}
        failed={lookup.isError}
        onScan={handleScan}
        onRetry={() => lookup.variables && runLookup(lookup.variables)}
      />
    );
  }
}

export default ReceptionPage;
